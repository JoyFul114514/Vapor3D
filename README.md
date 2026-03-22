# Vapor3D Engine

高性能、可编程的 **多阶段渲染管线 (Multi-Stage Pipeline)** 框架。

---

> **TODO**: 文档目前仅为大纲，我有时间再来详细补充 API 接口与集成指南。

---

## 核心特性

* **完全可编程管线**：引擎不内置任何渲染算法。开发者可完全接管并自定义 Shader 逻辑。
* **自定义渲染阶段**：引擎框架设计支持高效的中间数据交换，支持延迟渲染、G-Buffer 架构及代理几何体等高级技术的二次开发。

## 渲染效果

<img src="screenshots/4f608e9e7445583d0d3df88c7549e611.png" width="300px" alt="Rain Effect Demo">

## 提示

* **精度**：albedo 和 pbr 可使用 RGB8，position、normal 必须使用 RGBA16F，example 中 pbr 的 finalColor 也用了 RGBA16F 因为需要进行 gamma 矫正
* **示例**：可前往 example/ 查看我最近在写的一些二次开发作品，均采用MIT开源

> `example/pbr.sb3` 示例中使用的 PBR 贴图来源于 FreePBR.com。该资源遵循其官方授权协议，仅供学习与非商业演示使用。


**By: Joy_Ful** | License: MPL-2.0
