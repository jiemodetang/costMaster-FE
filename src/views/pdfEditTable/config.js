
import axios from 'axios';
import { ElMessage } from 'element-plus';


// 用于 IFPUG 功能点评估的提示语
const ifpugFunctionPointEvaluationPrompt = `您现在是一名资深软件造价师,您将获得由上边pdf软件系统的功能描述文本。
 您的任务是,使用IFPUG方法评估功能描述文本内的功能点。 请按照以下步骤进行评估: 
 1、逐字阅读功能描述文本。
 2、识别功能描述文本中的功能类型,功能类型有如下5种: 
  1）EI:用户向系统输入数据,该数据会被系统进行处理。EI通常为在系统中创建、修改、或删除的数据。
  2）EO:系统对数据进行计算后向用户展示计算结果的数据,EO通常为分析功能、计算功能、统计功能、个性化信息展示、自动生成等功能。
  3）EQ:查询展示功能,系统根据查询条件或者默认查询条件直接将内部数据展示给用户,不会进行任何数据计算修改等操作。EQ通常包括查询、下载、打印等功能。
  4）ILF:表示在系统内部维护的数据集合,这些数据集合由系统进行维护和管理。
  5）EIF:由系统外部维护,但被本系统访问的数据组。通常功能描述中包含有外部数据,对接,引入、接口、第三方等,表示有EIF 。
3、归纳出每个功能点名称,功能分类为子系统,一级模块,二级模块,原文本内容,功能点计数项名称,功能类型。
4、功能点名称和功能描述中不要出现EI、EQ、EO、ILF、EIF。通常ILF或者EIF的功能点名称都是以信息结尾的,如用户信息,报表信息等 。
5、将最后的结果整理成JSON格式输出,JSON格式如下，key必须如下描述: [{
    id: '',//id
    subsystem: "",//子系统
    level1: "",//一级模块
    level2: "",//二级模块
    description:'',//必须是对应原文本的内容
    countItem:'',//功能点计数项名称
    category:'' //识别功能描述文本中的功能类型

}]。请注意,description必须是对应原文本的内容,包括原标点符号,不要增加标点符号。
6.功能点计数项名称当有EI或者EO时,一定增加一条对应的ILF,且这一条在最前面。
7.功能点计数项要识别到的内容更加丰富，例如养殖场信息、供应商信息、员工信息、鸡舍信息这类型描述功能点计数项要全部识别。
  当二级模块名称带有管理,信息的含义时,如果原文带有创建、删除、修改、上传、查询信息含义，功能点计数项对应的ILF后增加创建或删除或修改或上传或查询项。
8.请只输出完整的JSON,不输出其他附加内容,且格式的key必须如上所述，绝对要完整`

const ifpugOtherEvaluationPrompt = `您现在是一名资深软件造价师,您将获得由上边pdf软件系统的功能描述文本。
 您的任务是,使用IFPUG方法评估功能描述文本内的功能点。 请按照以下步骤进行评估: 
 1、逐字阅读功能描述文本。
 2、识别功能描述文本中的功能类型,功能类型有如下2种: 
  1）ILF:表示在系统内部维护的数据集合,这些数据集合由系统进行维护和管理。
  2）EIF:由系统外部维护,但被本系统访问的数据组。通常功能描述中包含有外部数据,对接,引入、接口、第三方等,表示有EIF 。
3、归纳出每个功能点名称,功能分类为子系统,一级模块,二级模块,原文本内容,功能点计数项名称,功能类型。
4、功能点名称和功能描述中不要出现ILF、EIF。通常ILF或者EIF的功能点名称都是以信息结尾的,如用户信息,报表信息等 。
5、将最后的结果整理成JSON格式输出,JSON格式如下,key必须如下描述: [{
    id: '',//id
    subsystem: "",//子系统
    level1: "",//一级模块
    level2: "",//二级模块
    description:'',//必须是对应原文本的内容
    countItem:'',//功能点计数项名称
    category:'' //识别功能描述文本中的功能类型

}]。请注意,description必须是对应原文本的内容,包括原标点符号,不要增加标点符号。
6.功能点计数项要识别到的内容更加丰富,更加细化，例如农产品产地环境、农业投入品、农事生产过程这类型要分析出多条功能点，分别返回多条功能点计数项数据。同时对ILF的信息识别更加细致，分多条返回。
7.请只输出完整的JSON,不输出其他附加内容,且格式的key必须如上所述,绝对要完整`


const customizeEvaluationPrompt = `您现在是一名资深软件造价师,您将获得由上边pdf软件系统的功能描述文本。
请按照以下步骤进行评估:
1.
2.
3.
4.
5.
`
const commonJsonOutputFormat = `
最后请注意将最后的结果整理成JSON格式输出,JSON格式如下,key必须如下描述: [{
    id: '',//id
    subsystem: "",//子系统
    level1: "",//一级模块
    level2: "",//二级模块
    description:'',//必须是对应原文本的内容
    countItem:'',//功能点计数项名称
    category:'' //识别功能描述文本中的功能类型

}]。请注意,description必须是对应原文本的内容,包括原标点符号。请只输出完整的JSON,不输出其他附加内容,且格式的key必须如上所述，绝对要完整`
const apiConfigs = {
  'doubao-1-5-pro-32k-250115': {
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: "doubao-1-5-pro-32k-250115",
    name: '线路1【1-5-pro-32k-250115】',
    value: 'doubao-1-5-pro-32k-250115',
    maxTokens:12288, //12288
    authorization: 'a5634a1c-cbd6-4508-8566-00102c88f6ff'
  },

  'deepseek-v3-250324': {
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: "deepseek-v3-250324",
    name: '线路2【v3-250324】【推理能力显著提升】',
    value: 'deepseek-v3-250324',
    maxTokens: 16384,
    authorization: 'a5634a1c-cbd6-4508-8566-00102c88f6ff'
  },
  "GLM-4-plus": {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: "GLM-4-plus",
    name: '线路3【4-flash】【高智能旗舰】',
    value: 'GLM-4-plus',
    maxTokens: 128000, //128000
    authorization: 'da75a43d60a94c7eab5c5d652c0dcf1a.ZVMoJWynUyAD9cC8'
  },
    // glm-4-flash
    "GLM-4-flash": {
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: "GLM-4-flash",
      name: '线路4【4-flash】【速度更快】-免费',
      value: 'GLM-4-flash',
      maxTokens: 128000,
      authorization: 'da75a43d60a94c7eab5c5d652c0dcf1a.ZVMoJWynUyAD9cC8'
    },
  
};


// 辅助函数：执行单次 API 调用
async function makeApiCall(configName, messages,token) {
  const apiConfig = apiConfigs[configName];
  if (!apiConfig) {
    // ElMessage.error('未找到对应的配置'); // ElMessage might not be ideal in a non-component context
    console.error('未找到对应的配置:', configName);
    throw new Error('未找到对应的配置');
  }
  try {
    console.log(`向 ${apiConfig.model} 发起请求...`);
    const response = await axios.post(
      apiConfig.url,
      {
        // temperature: 0.9,
        // top_p: 0.9,
        stream: false,
        max_tokens:token?(token>=apiConfig.maxTokens?apiConfig.maxTokens:token):apiConfig.maxTokens,
        response_format: { "type": "json_object" }, // 请求 JSON 输出
        model: apiConfig.model,
        messages: messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.authorization}`
        }
      }
    );
    // 检查响应结构
    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        console.error("AI 响应格式不符合预期:", response.data);
        throw new Error('AI 响应格式不符合预期');
    }
    return response.data; // 返回完整的响应数据
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message || 'API 请求失败';
    console.error('API 请求失败:', errorMsg, error.response?.data);
    ElMessage.error(`API 请求失败: ${errorMsg}`);
    throw error; // 重新抛出错误，由调用者处理
  }
}

// 修改后的 aiAxios 函数，支持自动续传和合并
async function aiAxios(configName, initialContent,token) {
  let accumulatedJsonString = ''; // 初始化为空字符串
  let messages = [{ role: "user", content: initialContent || "" }];
  let finish_reason = "length";
  let safetyCounter = 0;
  const maxRetries = 10;

  console.log("开始 AI 请求流程...");

  while (finish_reason === "length" && safetyCounter < maxRetries) {
    safetyCounter++;
    console.log(`发起第 ${safetyCounter} 次 AI 请求...`);
    try {
      const responseData = await makeApiCall(configName, messages,token);
      const choice = responseData.choices[0];
      let contentChunk = choice.message.content;
      finish_reason = choice.finish_reason;

      // 移除所有Markdown代码块标记并保留方括号移除功能
      contentChunk = contentChunk.replace(/```json|```/g, '').replace(/[\[\]]/g, '');

      // 如果是第一次请求且内容不完整
      if ( !isValidJson(contentChunk)) {
        const lastValidEnd = findLastValidJsonEnd(contentChunk);
        if (lastValidEnd !== -1) {
          contentChunk = contentChunk.substring(0, lastValidEnd + 1);
          messages.push({ role: "user", content: `请从位置 ${lastValidEnd + 1} 继续生成JSON格式的内容。` });
        }
      }

      console.log(`收到部分回复 (第 ${safetyCounter} 次), finish_reason: ${finish_reason}`);
      
      // 添加逗号分隔符（如果不是第一次）
      if (accumulatedJsonString.length > 0 && contentChunk.length > 0) {
        accumulatedJsonString += ',';
      }
      accumulatedJsonString += contentChunk;

      messages.push({ role: "assistant", content: contentChunk });
      messages.push({ role: "user", content: "请继续生成。" });

      if (finish_reason !== "length" && finish_reason !== "stop") {
         const errorMsg = `AI 模型返回异常状态: ${finish_reason}`;
         console.error(errorMsg, responseData);
         ElMessage.error(errorMsg);
         throw new Error(errorMsg);
      }

    } catch (error) {
      console.error(`第 ${safetyCounter} 次 AI 请求失败:`, error);
      return Promise.reject(error);
    }
  }

  if (safetyCounter >= maxRetries && finish_reason === "length") {
      const errorMsg = `达到最大尝试次数 (${maxRetries})，但内容可能仍未完整。`;
      console.error(errorMsg);
      ElMessage.warning(errorMsg + " 返回当前已获取内容。");
  } else {
      console.log("所有部分接收完毕或达到停止条件，尝试解析完整 JSON...");
  }

  // 将累积的字符串包装成有效的JSON数组
  accumulatedJsonString = `[${accumulatedJsonString}]`;

  console.log("最终累积的字符串:", accumulatedJsonString);

  try {
    const parsedContent = JSON.parse(accumulatedJsonString);
    console.log('最终 AI 回复 (解析后):', parsedContent);
    return parsedContent;
  } catch (parseError) {
    console.error('解析最终 AI 回复内容时出错:', parseError);
    console.error('尝试解析的字符串:', accumulatedJsonString);
    ElMessage.error('解析最终 AI 回复内容时出错: ' + parseError.message + '，请检查控制台获取原始字符串。');
    return Promise.reject(new Error('最终 JSON 解析失败: ' + parseError.message));
  }
}

const  paramOptionsConfig= [
  { label: '估算功能点方法', value: 'default1' },
  { label: '预估功能点方法', value: 'default2' },
  // { label: '配置三(待训练)', value: 'default3' },
  { label: '自定义参数', value: 'custom' }
]
export {
  apiConfigs,
  ifpugFunctionPointEvaluationPrompt,
  customizeEvaluationPrompt,
  commonJsonOutputFormat,
  ifpugOtherEvaluationPrompt,
  paramOptionsConfig
}
export default aiAxios; // 导出修改后的函数

// 辅助函数：检查字符串是否是有效的JSON
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// 辅助函数：找到最后一个完整的JSON对象结束位置
function findLastValidJsonEnd(str) {
  let stack = 0;
  let inString = false;
  let lastEnd = -1;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '"' && str[i - 1] !== '\\') {
      inString = !inString;
    }

    if (!inString) {
      if (char === '{') {
        stack++;
      } else if (char === '}') {
        stack--;
        if (stack === 0) {
          lastEnd = i;
        }
      }
    }
  }

  return lastEnd;
}