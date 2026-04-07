# v0.app 适配提示词 - 理解新的数据结构

**版本**: v1.0  
**日期**: 2026年4月4日

---

## 📋 背景说明

v0项目之前的数据结构可能是不同的格式。现在需要适配新的数据库结构（v1.0），包含56个国家的社交媒体数据。

---

## 💡 完整提示词模板

### 基础版本(简短明快)

```
我们的项目需要升级社交媒体数据库结构。

新数据格式:
- 位置: public/data/countries/ 
- 格式: 56个Markdown文件，命名为 [COUNTRY_NAME]_COMPLETE_SOCIAL_MEDIA_DATA.md
- 元数据: public/data/metadata.json (JSON格式，包含国家列表和数据映射)

每个国家文件包含:
1. 基本信息: 人口、互联网用户数、社媒用户数
2. 数据来源说明表(显示来源机构和可信度)
3. 平台数据: Facebook, Instagram, YouTube, TikTok, WhatsApp等8+平台的MAU和渗透率
4. 人口统计: 按年龄、性别、教育、婚姻、收入分布
5. 平台特性分析和市场趋势

需要:
1. 创建数据加载函数，从public/data/countries/读取对应国家的Markdown文件
2. 创建React组件显示这些Markdown内容(使用react-markdown)
3. 创建国家选择器(基于countries-metadata.json的国家列表)
4. 确保能显示国家概览、平台数据、人口统计等多个数据面板

元数据结构(countries-metadata.json):
{
  "countries": [
    {
      "code": "CN",
      "name": "China",
      "region": "Asia",
      "file": "CHINA_COMPLETE_SOCIAL_MEDIA_DATA.md",
      "users": "12.8B",
      "penetration": "89%"
    },
    ... (共56个国家)
  ]
}

请生成一个能够加载、解析和显示这些新格式数据的完整解决方案。
```

### 详细版本(完整说明)

```
项目背景: 我们正在将社交媒体数据库从旧版本(v0)升级到新版本(v1.0)，需要你帮助适配新的数据结构。

## 旧数据结构问题
- 可能是单一JSON文件或不同的目录组织
- 国家数据可能不完整或格式不一致
- 缺少详细的数据来源说明

## 新数据结构特点
### 文件位置
- 数据路径: `public/data/countries/`
- 元数据: `public/data/metadata.json`

### 数据格式
#### Markdown 国家报告 (56个国家)
- 命名: `[COUNTRY]_COMPLETE_SOCIAL_MEDIA_DATA.md`
- 格式: 结构化Markdown文档
- 包含内容:
  * 标题: # [国家名]社交媒体数据报告
  * 基本统计: 人口、互联网用户数、社媒用户数、渗透率
  * 📌 数据来源说明表: 来源机构、发布日期、可信度评分(⭐)
  * 📊 平台数据表: 平台名称、MAU、渗透率、日均时长、性别比例
  * 👥 用户人口统计: 性别分布、年龄分布、教育程度、婚姻状态、收入分布
  * 📱 平台特性分析: 各平台的使用特点和优势
  * 🎯 关键趋势: 市场的5大发展趋势

#### JSON 元数据文件
- 文件: `countries-metadata.json`
- 结构:
  ```json
  {
    "version": "1.0",
    "lastUpdated": "2026-04-04",
    "totalCountries": 56,
    "regions": { "Asia": 16, "Europe": 13, ... },
    "countries": [
      {
        "code": "CN",
        "name": "China",
        "region": "Asia",
        "file": "CHINA_COMPLETE_SOCIAL_MEDIA_DATA.md",
        "users": "12.8B",
        "penetration": "89%",
        "population": "1.45B"
      },
      ...
    ]
  }
  ```

## 需要实现的功能

### 1. 数据加载层
```javascript
// 从metadata.json加载国家列表
async function loadCountries() {
  const response = await fetch('/data/metadata.json');
  return response.json();
}

// 从Markdown文件加载具体国家数据
async function loadCountryData(countryCode) {
  const response = await fetch(`/data/countries/${countryCode}_COMPLETE_SOCIAL_MEDIA_DATA.md`);
  return response.text();
}
```

### 2. 数据解析和显示
- 使用 `react-markdown` 库解析和显示Markdown内容
- 提取结构化数据(可选): 从Markdown中提取平台数据、统计数据等用于图表展示
- 支持表格、列表、代码块等Markdown元素

### 3. UI 组件需求
- CountrySelector: 国家选择下拉菜单或网格(基于metadata.json)
- CountryOverview: 显示国家基本统计信息(人口、用户数等)
- PlatformDataDisplay: 展示平台数据(可以是表格或卡片)
- DemographicsPanel: 展示人口统计数据(可视化为图表)
- TrendsList: 显示关键市场趋势
- DataSourceInfo: 显示数据来源和可信度

### 4. 数据特点注意
- 所有数据都经过验证,与2025年Q4官方财报对比通过
- 每个数据都有明确的来源标注(见数据来源说明表)
- 数据可信度评分用星号表示(⭐⭐⭐⭐⭐)
- Markdown格式包含多个数据表格,需要正确渲染

## 实现建议

1. **快速实现**: 直接使用react-markdown显示Markdown文件
2. **高级实现**: 解析Markdown提取结构化数据，用于图表和分析
3. **性能优化**: 实现懒加载(用户选择国家时才加载)和缓存机制

## 测试验证
- 验证能加载所有56个国家的数据
- 验证Markdown正确渲染(包括表格、列表等)
- 验证元数据显示正确(国家列表、用户数等)
- 验证能切换不同国家显示对应数据

请根据这个新的数据结构,为我的v0.app项目生成完整的数据加载、解析和显示解决方案。
```

### 针对性版本(如果v0之前是JSON结构)

```
我们的项目之前使用JSON格式存储国家数据,现在需要升级到新的Markdown+JSON混合结构。

旧结构可能是:
{
  "countries": [
    {
      "code": "CN",
      "name": "China",
      "population": "...",
      "platforms": { "facebook": {...}, "instagram": {...} },
      "demographics": { "age": [...], "gender": [...] }
    }
  ]
}

新结构是:
1. metadata.json - 国家列表和基本信息(JSON格式)
2. 单个Markdown文件 - 每个国家的完整详细报告(56个文件)

需要:
1. 更新数据加载逻辑,从Markdown文件而不是JSON加载数据
2. 保持现有的UI组件结构,只修改数据源
3. 如需要,可从Markdown中提取结构化数据转为原来的JSON格式显示
4. 确保性能不会因为文件数增加而下降

请帮我:
1. 创建新的数据加载函数(支持metadata.json和Markdown文件)
2. 提供数据转换函数(将Markdown格式转为可用的数据对象)
3. 更新现有组件,使其能显示新格式的数据
4. 保证向后兼容性(如果还需要支持旧数据)
```

### 针对性版本(如果v0之前是API结构)

```
我们的项目之前从API端点获取社交媒体数据,现在需要改为本地Markdown+JSON文件结构。

旧结构: GET /api/countries/{code}/social-media
新结构: public/data/countries/{CODE}_COMPLETE_SOCIAL_MEDIA_DATA.md + public/data/metadata.json

需要:
1. 替换API调用,使用本地文件加载
2. 创建一个abstraction layer,使业务逻辑无需改动
3. 保持相同的数据接口(如果可能)
4. 增加懒加载和缓存以保证性能

新的文件结构:
- public/data/metadata.json (56个国家的列表和基本信息)
- public/data/countries/CHINA_COMPLETE_SOCIAL_MEDIA_DATA.md (等)

请帮助我:
1. 创建一个数据适配层,隐藏Markdown和JSON的复杂性
2. 提供与旧API相同接口的加载函数
3. 处理Markdown解析和数据提取
4. 确保现有业务逻辑可以继续工作
```

---

## 🎯 如何使用这个提示词

1. **选择合适的版本**:
   - 快速开始 → 使用"基础版本"
   - 详细规划 → 使用"详细版本"
   - 特定场景 → 使用"针对性版本"

2. **复制整段提示词到v0.app**:
   - 打开v0.app的对话框或提示输入
   - 粘贴整段提示词
   - 点击发送/生成

3. **预期结果**:
   - v0会生成数据加载函数
   - v0会生成React组件代码
   - v0会提供具体的实现步骤
   - v0会考虑性能和兼容性

---

## 💡 提示词优化建议

可以根据你的具体情况调整:

```
// 如果需要特定框架
请使用 [React/Vue/Next.js] 框架实现

// 如果需要特定UI库
请使用 [Tailwind/Material-UI/Ant Design] 进行样式设计

// 如果需要特定功能
另外,请添加搜索、过滤、排序功能

// 如果有性能要求
确保支持大量文件(56个)的高效加载
```

---

**建议**: 复制"详细版本"的提示词,粘贴到v0.app中,v0会为你生成完整的适配方案!
