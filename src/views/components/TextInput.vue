<template>
    <div>
      <el-input
        v-model="searchText"
        placeholder="请输入需要高亮的文本"
        @change="handleSearch"
      ></el-input>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      pdfContentText: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        searchText: ''
      }
    },
    methods: {
      handleSearch() {
        this.$emit('text-searched', this.searchText)
      }
    }
  }
  </script>
  