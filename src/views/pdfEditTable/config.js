
import axios from 'axios';
// 引入 ElMessage
import { ElMessage } from 'element-plus';


const jsonValue = [{
  id: '',//默认id
  funcText: '',//功能点名称
  funcItems: {
    id: "",//id
    subsystem: "",//子系统
    level1: "",//一级模块
    countItem: '',//功能点计数项名称
    description: '',//功能描述
    category: '',//功能分类
    ufp: 5,//UFP
    reuseLevel: '',//可复用性
    modifyType: '',//可修改性
    us: '',//US
    remark: '',//备注 
  }
}]

// 用于 IFPUG 功能点评估的提示语
const ifpugFunctionPointEvaluationPrompt = `您现在是一名资深软件造价师,您将获得由上边pdf软件系统的功能描述文本。
 您的任务是,使用IFPUG方法评估功能描述文本内的功能点。 请按照以下步骤进行评估: 
 1、逐字阅读功能描述文本。
 2、识别功能描述文本中的功能类型,功能类型有如下5种: 
  1）EI:用户向系统输入数据,该数据会被系统进行处理。EI通常为在系统中创建、修改、或删除的数据。当描述文本中是数据管理的含义时,需要将该管理功能识别为数据创建、数据删除、数据修改这3个功能。
  2）EO:系统对数据进行计算后向用户展示计算结果的数据,EO通常为分析功能、计算功能、统计功能、个性化信息展示、自动生成等功能。
  3）EQ:查询展示功能,系统根据查询条件或者默认查询条件直接将内部数据展示给用户,不会进行任何数据计算修改等操作。EQ通常包括查询、下载、打印等功能。
  4）ILF:表示在系统内部维护的数据集合,这些数据集合由系统进行维护和管理。当有EI或者EO时,一定有对应的ILF。 
  5）EIF:由系统外部维护,但被本系统访问的数据组。通常功能描述中包含有外部数据,对接,引入、接口、第三方等,表示有EIF 。
3、归纳出每个功能点名称,功能分类为子系统,一级模块,二级模块,转化的对应原文本内容,功能点计数项名称,功能类型。请注意,其中二级模块一定要分开描述。
4、功能点名称和功能描述中不要出现EI、EQ、EO、ILF、EIF。通常ILF或者EIF的功能点名称都是以信息结尾的,如用户信息,报表信息等 。
5、将最后的结果整理成JSON格式输出,JSON格式如下，key必须如下描述: [{
    id: '',//id
    subsystem: "",//子系统
    level1: "",//一级模块
    level2: "",//二级模块
    description: '',//转化的对应原文本内容
    countItem：'',//功能点计数项名称
    category:'' //识别功能描述文本中的功能类型

}]
6、请只输出JSON,不输出其他附加内容,且格式的key必须如上所述`
const customizeEvaluationPrompt = `以下三点，必须遵守，
 1.功能分类为子系统,一级模块,功能点计数项名称,功能项描述,功能类型,转化前对应文本,注意,其中功能点计数项名称要分开描述。
 2.将最后的结果整理成JSON格式输出，请必须只输出JSON,不输出其他附加内容,且格式必须如下所述[{
    id: '',//id
    subsystem: "",//子系统 
    level1: "",//一级模块
    countItem: '',//功能点计数项名称
    description: '',//功能项描述
    category:'' //识别功能描述文本中的功能类型
    pdfTransformText: ''//转化前对应文本
}]
    3.请只输出JSON,不输出其他附加内容`

const apiConfigs = {
  'doubao-1-5-pro-32k-250115': {
    url: 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions',
    model: "doubao-1-5-pro-32k-250115",
    name: 'doubao-1-5-pro-32k-250115',
    value: 'doubao-1-5-pro-32k-250115',
    authorization: 'a5634a1c-cbd6-4508-8566-00102c88f6ff'
  },
  // deepSeekR1: {
  //   url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  //   model: "ep-20250417081903-q852h",
  //   name: 'DeepSeek-R1',
  //   value: 'DeepSeek-R1',
  //   maxTokens:16000,
  //   authorization: 'a5634a1c-cbd6-4508-8566-00102c88f6ff'
  // },
  'deepseek-v3-250324': {
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: "deepseek-v3-250324",
    name: 'deepseek-v3-250324 【推理能力显著提升】',
    value: 'deepseek-v3-250324',
    maxTokens:16384,
    authorization: 'a5634a1c-cbd6-4508-8566-00102c88f6ff'
  },
  // glm-4-flash
  "GLM-4-flash": {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: "GLM-4-flash",
    name: 'GLM-4-flash 【速度更快】',
    value: 'GLM-4-flash',
    maxTokens: 128000,
    authorization: 'da75a43d60a94c7eab5c5d652c0dcf1a.ZVMoJWynUyAD9cC8'
  },
  // "glm-4-air-250414": {
  //   url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  //   model: "glm-4-air-250414",
  //   name: 'glm-4-air-250414',
  //   value: 'glm-4-air-250414',
  //   maxTokens: 16000,
  //   authorization: 'da75a43d60a94c7eab5c5d652c0dcf1a.ZVMoJWynUyAD9cC8'
  // },
  "GLM-4-plus": {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: "GLM-4-plus",
    name: 'GLM-4-plus 【深度思考】',
    value: 'GLM-4-plus',
    maxTokens: 128000,
    authorization: 'da75a43d60a94c7eab5c5d652c0dcf1a.ZVMoJWynUyAD9cC8'
  },
};

// 根据配置名称发起请求的函数，使用 Promise 封装
function aiAxios(configName, content) {
  return new Promise((resolve, reject) => {
    const apiConfig = apiConfigs[configName];
    console.log( apiConfigs,configName);
    
    if (!apiConfig) {
      // 使用 ElMessage 显示错误信息
      ElMessage.error('未找到对应的配置');
      reject(new Error('未找到对应的配置'));
      return;
    }

    axios.post(
      apiConfig.url,
      {
        max_tokens: apiConfig.maxTokens,
        response_format: { "type": "json_object" },
        model: apiConfig.model,
        messages: [{ role: "user", content: content || "" }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.authorization}`
        }
      }
    ).then((response) => {
      const content = response.data.choices[0].message.content;
      let jsonContent = content;
      
      // 如果包含 ```json 标记，提取 JSON 部分
      if (content.startsWith('```json')) {
        jsonContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      try {
        // 尝试解析 JSON 数据
        const parsedContent = JSON.parse(jsonContent);
        console.log('AI回复:', parsedContent);
        resolve(parsedContent);
      } catch (parseError) {
        // 解析失败，使用 ElMessage 显示错误信息并拒绝 Promise
        ElMessage.error('解析 AI 回复内容时出错: ' + parseError.message);
        reject(parseError);
      }
    }).catch((error) => {
      // 使用 ElMessage 显示错误信息
      ElMessage.error(error.response?.data || error.message);
      reject(error);
    });
  });
}
export {
  apiConfigs,
  ifpugFunctionPointEvaluationPrompt,
  customizeEvaluationPrompt
}
export default aiAxios