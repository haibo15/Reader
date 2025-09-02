<template>
  <div class="home">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>📚 智能文本阅读器</h1>
          <p>基于阿里巴巴Qwen大模型的文本转语音系统</p>
        </div>
      </el-header>

      <el-main>
        <el-card class="welcome-card">
          <template #header>
            <div class="card-header">
              <span>🎉 Vue 3 项目初始化成功！</span>
            </div>
          </template>

          <div class="welcome-content">
            <el-alert
              title="项目配置完成"
              type="success"
              description="Vue 3 + TypeScript + Element Plus + Pinia + Vue Router 已成功配置"
              show-icon
              :closable="false"
            />

            <div class="feature-list">
              <h3>已配置的功能：</h3>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-card shadow="hover">
                    <template #header>
                      <div class="feature-header">
                        <el-icon><VueIcon /></el-icon>
                        <span>Vue 3</span>
                      </div>
                    </template>
                    <p>现代化的Vue框架，使用Composition API</p>
                  </el-card>
                </el-col>

                <el-col :span="8">
                  <el-card shadow="hover">
                    <template #header>
                      <div class="feature-header">
                        <el-icon><Setting /></el-icon>
                        <span>Element Plus</span>
                      </div>
                    </template>
                    <p>功能丰富的Vue 3 UI组件库</p>
                  </el-card>
                </el-col>

                <el-col :span="8">
                  <el-card shadow="hover">
                    <template #header>
                      <div class="feature-header">
                        <el-icon><DataAnalysis /></el-icon>
                        <span>Pinia</span>
                      </div>
                    </template>
                    <p>Vue 3官方推荐的状态管理库</p>
                  </el-card>
                </el-col>
              </el-row>
            </div>

            <div class="next-steps">
              <h3>下一步计划：</h3>
              <el-steps :active="1" align-center>
                <el-step title="项目初始化" description="已完成" />
                <el-step title="状态管理迁移" description="进行中" />
                <el-step title="组件迁移" description="待开始" />
                <el-step title="API服务层" description="待开始" />
                <el-step title="路由和页面组件" description="待开始" />
              </el-steps>
            </div>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { VueIcon, Setting, DataAnalysis } from '@element-plus/icons-vue'
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-content {
  text-align: center;
  color: white;
  padding: 20px 0;
}

.header-content h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.header-content p {
  margin: 10px 0 0 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.el-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content {
  padding: 20px 0;
}

.feature-list {
  margin: 30px 0;
}

.feature-list h3 {
  margin-bottom: 20px;
  color: #303133;
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.next-steps {
  margin: 30px 0;
}

.next-steps h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>
