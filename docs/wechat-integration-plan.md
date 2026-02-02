# 微信公众号推送通知实施方案

## 📋 前提条件检查

在开始之前，请确认你的公众号类型：

### 1. 公众号类型确认
- **服务号**：✅ 可以发送模板消息（推荐）
- **订阅号**：❌ 不能发送模板消息，只能发送客服消息

**如何查看：** 登录微信公众平台 → 设置与开发 → 基本配置 → 查看"公众号类型"

### 2. 认证状态
- **已认证**：✅ 可以使用所有接口
- **未认证**：❌ 需要先完成认证（300元/年）

---

## 🏗️ 技术架构

```
用户预约
    ↓
前端网页（获取微信授权）
    ↓
Supabase Database（存储 openid + 订单）
    ↓
管理员更改订单状态
    ↓
Supabase Edge Function（触发器）
    ↓
微信公众号 API（发送模板消息）
    ↓
用户微信接收通知
```

---

## 📝 实施步骤

### 第一步：公众号配置（30分钟）

1. **获取开发者凭证**
   - 登录微信公众平台
   - 设置与开发 → 基本配置
   - 记录：AppID 和 AppSecret

2. **配置服务器域名**
   - 设置与开发 → 公众号设置 → 功能设置
   - JS接口安全域名：添加你的网站域名
   - 网页授权域名：添加你的网站域名

3. **申请模板消息**
   - 功能 → 模板消息
   - 选择行业：IT科技 / 互联网|电子商务
   - 添加模板：订单状态提醒

**推荐模板格式：**
```
订单状态更新通知

订单编号：{{order_id.DATA}}
当前状态：{{status.DATA}}
预约时间：{{appointment_time.DATA}}
备注信息：{{remark.DATA}}

点击查看详情
```

---

### 第二步：前端集成微信授权（2小时）

**需要修改的文件：**
1. `booking.html` - 预约页面
2. `js/form-handler.js` - 表单处理

**实现流程：**
```javascript
// 1. 用户打开预约页面
// 2. 检测是否在微信浏览器中
// 3. 如果是，引导用户授权
// 4. 获取 openid
// 5. 提交订单时保存 openid
```

**代码示例：**
```javascript
// 检测微信浏览器
function isWechat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

// 获取微信授权
function getWechatAuth() {
  const appid = 'YOUR_APPID';
  const redirect_uri = encodeURIComponent('https://yoursite.com/booking.html');
  const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`;
  window.location.href = url;
}

// 获取 openid
async function getOpenid(code) {
  // 调用后端接口获取 openid
  const response = await fetch('/api/wechat/openid', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  return response.json();
}
```

---

### 第三步：后端服务（Supabase Edge Functions）（3小时）

**创建 Edge Function：**

#### 1. 获取 openid 的函数
```typescript
// supabase/functions/wechat-openid/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { code } = await req.json()

  const appid = Deno.env.get('WECHAT_APPID')
  const secret = Deno.env.get('WECHAT_SECRET')

  // 调用微信 API 获取 openid
  const response = await fetch(
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`
  )

  const data = await response.json()

  return new Response(
    JSON.stringify({ openid: data.openid }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

#### 2. 发送模板消息的函数
```typescript
// supabase/functions/wechat-notify/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { orderId, status } = await req.json()

  // 获取订单信息
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  const { data: order } = await supabase
    .from('guitar_repairs')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!order.wechat_openid) {
    return new Response('No openid', { status: 400 })
  }

  // 获取 access_token
  const appid = Deno.env.get('WECHAT_APPID')
  const secret = Deno.env.get('WECHAT_SECRET')

  const tokenResponse = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
  )
  const { access_token } = await tokenResponse.json()

  // 发送模板消息
  const statusLabels = {
    pending: '待排期',
    confirmed: '已确认',
    in_progress: '进行中',
    delayed: '延期中',
    completed: '已完成',
    cancelled: '已取消'
  }

  const message = {
    touser: order.wechat_openid,
    template_id: Deno.env.get('WECHAT_TEMPLATE_ID'),
    url: `https://yoursite.com/order-query.html?phone=${order.customer_phone}`,
    data: {
      order_id: {
        value: order.id.substring(0, 8),
        color: '#173177'
      },
      status: {
        value: statusLabels[status],
        color: '#173177'
      },
      appointment_time: {
        value: `${order.appointment_date} ${order.appointment_time}`,
        color: '#173177'
      },
      remark: {
        value: order.admin_notes || '暂无备注',
        color: '#173177'
      }
    }
  }

  const sendResponse = await fetch(
    `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`,
    {
      method: 'POST',
      body: JSON.stringify(message)
    }
  )

  return new Response(
    JSON.stringify(await sendResponse.json()),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

---

### 第四步：数据库触发器（1小时）

**在 Supabase 中创建触发器：**

```sql
-- 创建触发器函数
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在状态改变时触发
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- 调用 Edge Function
    PERFORM
      net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/wechat-notify',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR_ANON_KEY'
        ),
        body := jsonb_build_object(
          'orderId', NEW.id,
          'status', NEW.status
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER on_status_change
AFTER UPDATE ON guitar_repairs
FOR EACH ROW
EXECUTE FUNCTION notify_status_change();
```

---

### 第五步：数据库表结构更新

**添加 openid 字段：**

```sql
ALTER TABLE guitar_repairs
ADD COLUMN wechat_openid TEXT;

-- 添加索引
CREATE INDEX idx_wechat_openid ON guitar_repairs(wechat_openid);
```

---

## 🧪 测试流程

### 1. 本地测试
1. 使用微信开发者工具测试授权流程
2. 测试 openid 获取
3. 测试模板消息发送

### 2. 生产环境测试
1. 用真实手机号预约
2. 在管理后台更改状态
3. 检查微信是否收到通知

---

## 💰 成本估算

### 一次性成本
- 公众号认证费：300元/年（如果未认证）
- 开发时间：约6-8小时

### 运营成本
- 模板消息：免费（每月100万条额度）
- Supabase Edge Functions：免费（每月50万次调用）
- 服务器：0元（使用 Supabase）

**总成本：300元/年（仅公众号认证费）**

---

## 📊 预期效果

### 用户体验
- ✅ 订单状态实时推送到微信
- ✅ 点击通知直接查看订单详情
- ✅ 无需主动查询

### 业务价值
- ✅ 提升客户满意度
- ✅ 减少客户咨询量
- ✅ 增强品牌专业形象

### 数据指标
- 推送到达率：>90%
- 点击率：预计30-50%
- 客户满意度：预计提升20%+

---

## 🚀 下一步行动

1. **确认公众号类型和认证状态**
2. **提供公众号 AppID 和 AppSecret**
3. **确认网站域名**
4. **我开始开发集成代码**

---

## 📞 需要的信息

请提供以下信息，我将开始开发：

1. 公众号 AppID：`__________________`
2. 公众号 AppSecret：`__________________`
3. 网站域名：`__________________`
4. 公众号类型：服务号 / 订阅号
5. 认证状态：已认证 / 未认证

---

## ⚠️ 注意事项

1. **安全性**
   - AppSecret 必须保密，不能暴露在前端代码中
   - 使用 Supabase 环境变量存储敏感信息

2. **用户隐私**
   - 获取 openid 需要用户授权
   - 明确告知用户数据用途

3. **消息频率**
   - 避免频繁推送，影响用户体验
   - 只在关键状态变更时推送

4. **降级方案**
   - 如果用户未授权，仍可使用手机号查询
   - 确保两种方式都可用

---

## 📚 参考文档

- [微信公众号开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [模板消息接口](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Template_Message_Interface.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
