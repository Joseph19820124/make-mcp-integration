# Make.com MCP Server API 参考

## 工具 (Tools)

### list_scenarios

获取所有可用的 Make.com 场景。

**参数**: 无

**返回**: 场景列表，包含 ID、名称、状态、最后运行时间等信息

### run_scenario

执行指定的 Make.com 场景。

**参数**:
- `scenarioId` (string, required): 要执行的场景 ID
- `data` (object, optional): 传递给场景的数据

**返回**: 执行结果，包含执行 ID 和状态

### get_scenario_logs

获取场景的执行日志。

**参数**:
- `scenarioId` (string, required): 场景 ID
- `limit` (number, optional): 返回的日志条数，默认为 10

**返回**: 执行日志列表

## 资源 (Resources)

### make://scenarios

提供所有可用场景的资源访问。

**MIME 类型**: application/json

**内容**: 场景的详细信息列表

## 错误代码

- `AUTH_ERROR`: API 令牌无效或权限不足
- `SCENARIO_NOT_FOUND`: 指定的场景不存在
- `EXECUTION_FAILED`: 场景执行失败
- `RATE_LIMIT_EXCEEDED`: API 请求频率超限
- `NETWORK_ERROR`: 网络连接问题

## 配置选项

### 环境变量

- `MAKE_API_TOKEN`: Make.com API 令牌
- `MAKE_REGION`: Make.com 区域（eu1, us1, us2）
- `DEBUG`: 是否启用调试日志
- `WEBHOOK_SECRET`: Webhook 密钥

### 超时设置

- 默认请求超时: 30 秒
- 场景执行超时: 300 秒
- 连接超时: 10 秒