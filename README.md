# 纱线通 Mobile App

纱线 ERP 移动端（iOS/Android），基于 Expo + React Native + TypeScript。

## 技术栈

- Expo SDK 51
- React Native 0.74
- TypeScript
- React Navigation（底部 Tab + 原生 Stack）
- Zustand（状态管理）
- Expo Secure Store（持久化会话）
- Linear Gradient / SVG

## 功能模块

| 页面 | 说明 |
|------|------|
| 登录 | 手机号 + 密码 → 调用 `/biz/api/auth/login`，会话存入 SecureStore |
| 工作台 | KPI 卡片、今日出货量、待处理事项、快捷入口 |
| 销售单 | 列表、状态筛选、下拉刷新（对接 `/biz/api/sales/list`） |
| 库存 | 库存总览、低库存预警、分段筛选（对接 `/biz/api/inventory/list`） |
| 客户对账 | 应收汇总、客户列表与欠款（对接 `/biz/api/contact/customers`） |
| 我的 | 账户信息、采购/供应商/报表入口、租户切换、退出登录 |

## 后端连接

默认连接：
- iOS 模拟器 → `http://localhost:8080`
- Android 模拟器 → `http://10.0.2.2:8080`
- 物理设备 → 设置环境变量 `EXPO_PUBLIC_API_BASE=http://<你的局域网IP>:8080`

所有接口前缀：`/biz/api`

## 启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 或直接打开模拟器
npm run ios      # 需要 Xcode
npm run android  # 需要 Android SDK

# 真机：扫 Expo 客户端 App 的二维码即可
```

## 测试账号

- 手机号：`13800138000`
- 密码：`123456`

## 目录结构

```
src/
├── api/         # 后端 API 封装
├── components/  # 通用组件（Badge/KPI/NavBar/Segment）
├── navigation/  # 路由（Stack + BottomTabs）
├── screens/     # 页面
├── store/       # Zustand store
└── theme/       # 设计 tokens（颜色、字体）
```

## 设计语言

与 Web 端保持一致的「深海军蓝工业风」：
- 主色：`#1e6091` / `#0a3d62`
- 背景：`#f5f6fa`
- 数字等宽字体：Menlo/SF Mono
- 中文字体：PingFang SC（iOS 系统默认）
