# Supabase 配置指南

本指南将帮助您配置 Supabase 以支持吉他维修预约系统。

## 1. 创建数据库表

登录 Supabase Dashboard，进入 SQL Editor，执行以下 SQL：

```sql
-- 创建吉他维修订单表
CREATE TABLE guitar_repairs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name varchar(100) NOT NULL,
  customer_email varchar(255) NOT NULL,
  customer_phone varchar(20) NOT NULL,
  guitar_type varchar(50) NOT NULL CHECK (guitar_type IN ('acoustic', 'classical', 'electric', 'bass', 'other')),
  guitar_brand varchar(100),
  guitar_model varchar(100),
  problem_description text NOT NULL,
  image_url varchar(500),
  appointment_date date NOT NULL,
  appointment_time varchar(20) NOT NULL,
  expected_completion_date date NOT NULL,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  admin_notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_guitar_repairs_appointment_date ON guitar_repairs(appointment_date);
CREATE INDEX idx_guitar_repairs_status ON guitar_repairs(status);
CREATE INDEX idx_guitar_repairs_customer_email ON guitar_repairs(customer_email);

-- 创建更新时间戳触发器（如果 update_updated_at_column 函数不存在，先创建它）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_guitar_repairs_updated_at
BEFORE UPDATE ON guitar_repairs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## 2. 配置 Row Level Security (RLS)

继续在 SQL Editor 中执行：

```sql
-- 启用RLS
ALTER TABLE guitar_repairs ENABLE ROW LEVEL SECURITY;

-- 任何人都可以创建维修订单（支持游客预约）
CREATE POLICY "Anyone can create repair orders"
ON guitar_repairs FOR INSERT
WITH CHECK (true);

-- 任何人都可以查看所有订单（简化版，生产环境建议限制）
CREATE POLICY "Anyone can view orders"
ON guitar_repairs FOR SELECT
USING (true);

-- 认证用户可以更新订单（管理员功能）
CREATE POLICY "Authenticated users can update orders"
ON guitar_repairs FOR UPDATE
TO authenticated
USING (true);

-- 认证用户可以删除订单（管理员功能）
CREATE POLICY "Authenticated users can delete orders"
ON guitar_repairs FOR DELETE
TO authenticated
USING (true);
```

## 3. 创建 Storage Bucket

### 步骤：

1. 在 Supabase Dashboard 中，点击左侧菜单的 **Storage**
2. 点击 **New bucket** 按钮
3. 填写以下信息：
   - **Name**: `guitar-images`
   - **Public bucket**: ✅ 勾选（允许公开访问）
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/jpg, video/mp4`
4. 点击 **Create bucket**

### 配置 Storage 策略

在 Storage 页面，选择 `guitar-images` bucket，点击 **Policies** 标签，然后点击 **New Policy**：

**策略 1：允许任何人上传图片**
```sql
CREATE POLICY "Anyone can upload guitar images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'guitar-images');
```

**策略 2：允许任何人查看图片**
```sql
CREATE POLICY "Anyone can view guitar images"
ON storage.objects FOR SELECT
USING (bucket_id = 'guitar-images');
```

或者直接在 SQL Editor 中执行上述两条 SQL。

## 4. 验证配置

### 测试数据库表

在 SQL Editor 中执行：

```sql
-- 插入测试数据
INSERT INTO guitar_repairs (
  customer_name,
  customer_email,
  customer_phone,
  guitar_type,
  guitar_brand,
  guitar_model,
  problem_description,
  appointment_date,
  appointment_time,
  expected_completion_date
)
VALUES (
  '13800138000',
  '13800138000@phone.local',
  '13800138000',
  'acoustic',
  'Martin',
  'D-28',
  '测试问题描述',
  CURRENT_DATE + 1,
  '10:00-11:00',
  CURRENT_DATE + 3
);

-- 查询测试数据
SELECT * FROM guitar_repairs;

-- 删除测试数据
DELETE FROM guitar_repairs WHERE customer_phone = '13800138000';
```

### 测试 Storage

1. 在 Storage 页面，选择 `guitar-images` bucket
2. 尝试上传一张测试图片
3. 上传成功后，点击图片查看是否可以访问
4. 删除测试图片

## 5. 获取 Supabase 凭证

确保您的 `js/supabase-client.js` 文件中已正确配置：

- **SUPABASE_URL**: 您的项目 URL（在 Project Settings > API 中找到）
- **SUPABASE_ANON_KEY**: 您的匿名密钥（在 Project Settings > API 中找到）

## 完成！

配置完成后，您的吉他维修预约系统就可以正常使用了。
