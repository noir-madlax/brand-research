# v0.app 项目集成指南

**版本**: v1.0  
**日期**: 2026年4月4日  
**用途**: 将56个国家的社交媒体数据集成到v0.app项目

---

## 📋 集成步骤

### 第一步: 上传数据文件到v0.app

1. 登录 v0.app 账户
2. 打开你的v0项目
3. 创建以下目录结构:
   ```
   your-project/
   ├── public/data/
   │   ├── countries/
   │   │   ├── CHINA_COMPLETE_SOCIAL_MEDIA_DATA.md
   │   │   ├── USA_COMPLETE_SOCIAL_MEDIA_DATA.md
   │   │   └── ... (其他54个国家)
   │   └── docs/
   │       ├── README.md
   │       ├── INDEX.md
   │       └── ... (质量文档)
   └── src/
       └── data/
           └── social-media.json (见第二步)
   ```

4. 上传所有文件:
   - 56个 `*_COMPLETE_SOCIAL_MEDIA_DATA.md` 文件
   - 质量和说明文档

### 第二步: 创建数据索引文件

在 `src/data/social-media.json` 中创建:

```json
{
  "version": "1.0",
  "lastUpdated": "2026-04-04",
  "countries": {
    "CN": {
      "name": "China",
      "file": "/data/countries/CHINA_COMPLETE_SOCIAL_MEDIA_DATA.md",
      "region": "Asia",
      "users": "12.8B",
      "penetration": "89%"
    },
    "US": {
      "name": "United States",
      "file": "/data/countries/USA_COMPLETE_SOCIAL_MEDIA_DATA.md",
      "region": "Americas",
      "users": "253M",
      "penetration": "76%"
    },
    // ... 其他54国
  },
  "totalCountries": 56,
  "totalUsers": "~30B"
}
```

### 第三步: 添加数据加载函数

在你的v0.app项目中添加:

```javascript
// src/lib/loadCountryData.js
export async function loadCountryData(countryCode) {
  try {
    const response = await fetch(
      `/data/countries/${countryCode}_COMPLETE_SOCIAL_MEDIA_DATA.md`
    );
    if (!response.ok) throw new Error('Country data not found');
    return await response.text();
  } catch (error) {
    console.error(`Error loading data for ${countryCode}:`, error);
    return null;
  }
}

export async function loadCountryList() {
  const response = await fetch('/data/social-media.json');
  return await response.json();
}
```

### 第四步: 显示数据的示例组件

```jsx
// src/components/CountryDataViewer.jsx
import { useState, useEffect } from 'react';
import { loadCountryData, loadCountryList } from '@/lib/loadCountryData';
import ReactMarkdown from 'react-markdown';

export default function CountryDataViewer() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCountryList().then(setCountries);
  }, []);

  const handleSelectCountry = async (countryCode) => {
    setLoading(true);
    const countryData = await loadCountryData(countryCode);
    setData(countryData);
    setSelectedCountry(countryCode);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <h3>Countries</h3>
        <ul className="space-y-2">
          {countries.map(country => (
            <button
              key={country.code}
              onClick={() => handleSelectCountry(country.code)}
              className="text-left hover:bg-gray-100"
            >
              {country.name}
            </button>
          ))}
        </ul>
      </div>
      <div className="col-span-3">
        {loading && <p>Loading...</p>}
        {data && <ReactMarkdown>{data}</ReactMarkdown>}
      </div>
    </div>
  );
}
```

### 第五步: 测试集成

1. 运行你的v0.app项目
2. 测试能否加载国家数据
3. 验证Markdown正确显示
4. 检查所有56个国家都可访问

---

## 🎯 快速集成清单

- [ ] 创建数据目录结构
- [ ] 上传所有56个国家报告文件
- [ ] 上传质量文档
- [ ] 创建 social-media.json 索引
- [ ] 添加数据加载函数
- [ ] 创建组件显示数据
- [ ] 测试数据加载
- [ ] 验证所有国家可访问

---

## 📦 文件清单

**要上传的文件**: 81个

**国家报告** (56个):
```
ARGENTINA_COMPLETE_SOCIAL_MEDIA_DATA.md
AUSTRALIA_COMPLETE_SOCIAL_MEDIA_DATA.md
...
(完整列表见INDEX.md)
```

**文档** (23个):
- README.md
- INDEX.md
- DATA_*.md (质量文档)
- PROJECT_*.md (项目文档)
- FINAL_*.md (最终报告)

---

## 🚀 部署后验证

```javascript
// 添加到页面检查数据完整性
async function verifyDataIntegrity() {
  const countries = await loadCountryList();
  console.log(`Total countries: ${countries.totalCountries}`);
  
  // 测试加载前5个国家
  for (let i = 0; i < 5; i++) {
    const data = await loadCountryData(countries[i].code);
    if (data) {
      console.log(`✅ ${countries[i].name} loaded successfully`);
    }
  }
}
```

---

## ⚠️ 注意事项

1. **大小写敏感**: 文件名大小写必须匹配
2. **路径正确**: 确保 `/data/` 目录在public或根目录
3. **CORS**: 如果在不同域，注意跨域问题
4. **性能**: 大量Markdown文件可能影响性能，考虑懒加载

---

**集成帮助**: 如有问题，参考 README.md 和 INDEX.md
