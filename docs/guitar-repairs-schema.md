# 吉他维修预约系统 - 数据库设计

## guitar_repairs 表（吉他维修订单表）

存储所有吉他维修预约信息。

**注意**: 系统不收集客户姓名和邮箱，仅使用电话号码作为唯一标识。customer_name 和 customer_email 字段由系统自动填充。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 订单ID |
| customer_name | varchar(100) | NOT NULL | 系统自动填充（使用电话号码） |
| customer_email | varchar(255) | NOT NULL | 系统自动填充（电话号码@phone.local） |
| customer_phone | varchar(20) | NOT NULL | 客户电话（唯一必填的客户信息） |
| guitar_type | varchar(50) | NOT NULL | 吉他类型 |
| guitar_brand | varchar(100) | | 吉他品牌 |
| guitar_model | varchar(100) | | 吉他型号 |
| problem_description | text | NOT NULL | 问题描述 |
| image_url | varchar(500) | | 吉他图片/视频URL |
| appointment_date | date | NOT NULL | 预约日期 |
| appointment_time | varchar(20) | NOT NULL | 预约时间段（如"09:00-10:00"） |
| expected_completion_date | date | NOT NULL | 期望完成日期 |
| status | varchar(20) | DEFAULT 'pending' | 订单状态 |
| admin_notes | text | | 管理员备注 |
| created_at | timestamp | DEFAULT now() | 创建时间 |
| updated_at | timestamp | DEFAULT now() | 更新时间 |

### 吉他类型枚举值
- `acoustic` - 木吉他
- `classical` - 古典吉他
- `electric` - 电吉他
- `bass` - 贝斯
- `other` - 其他

### 订单状态枚举值
- `pending` - 待确认
- `confirmed` - 已确认
- `in_progress` - 维修中
- `completed` - 已完成
- `cancelled` - 已取消

### 文件上传支持
- **图片格式**: JPG, PNG, WEBP
- **视频格式**: MP4
- **最大文件大小**: 10MB

## SQL 创建语句

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

-- 创建更新时间戳触发器
CREATE TRIGGER trigger_update_guitar_repairs_updated_at
BEFORE UPDATE ON guitar_repairs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS) 策略

```sql
-- 启用RLS
ALTER TABLE guitar_repairs ENABLE ROW LEVEL SECURITY;

-- 任何人都可以创建维修订单（支持游客预约）
CREATE POLICY "Anyone can create repair orders"
ON guitar_repairs FOR INSERT
WITH CHECK (true);

-- 客户可以通过邮箱查看自己的订单
CREATE POLICY "Customers can view their own orders by email"
ON guitar_repairs FOR SELECT
USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email' OR auth.role() = 'anon');

-- 管理员可以查看和更新所有订单（需要自定义角色）
-- 暂时允许认证用户查看和更新所有订单
CREATE POLICY "Authenticated users can view all orders"
ON guitar_repairs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update orders"
ON guitar_repairs FOR UPDATE
TO authenticated
USING (true);
```

## 时间段管理

### 营业时间配置
- 工作日：周一至周五
- 营业时间：9:00 - 18:00
- 时间段单位：1小时
- 可预约时间段：
  - 09:00-10:00
  - 10:00-11:00
  - 11:00-12:00
  - 12:00-13:00（午休，可选择是否开放）
  - 13:00-14:00
  - 14:00-15:00
  - 15:00-16:00
  - 16:00-17:00
  - 17:00-18:00

### 时间段闲忙状态
- **空闲**（idle）：该时间段预约数 ≤ 1
- **一般**（normal）：该时间段预约数 = 2-3
- **繁忙**（busy）：该时间段预约数 > 3

### 查询时间段预约数量

```sql
-- 查询指定日期各时间段的预约数量
SELECT
  appointment_time,
  COUNT(*) as booking_count,
  CASE
    WHEN COUNT(*) <= 1 THEN 'idle'
    WHEN COUNT(*) BETWEEN 2 AND 3 THEN 'normal'
    ELSE 'busy'
  END as status
FROM guitar_repairs
WHERE appointment_date = '2026-01-20'
  AND status NOT IN ('cancelled')
GROUP BY appointment_time
ORDER BY appointment_time;
```

## Supabase Storage 配置

### 创建存储桶

```sql
-- 在 Supabase Dashboard 中创建存储桶
-- Bucket name: guitar-images
-- Public: true (允许公开访问)
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, video/mp4
```

### 存储策略

```sql
-- 允许任何人上传图片
CREATE POLICY "Anyone can upload guitar images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'guitar-images');

-- 允许任何人查看图片
CREATE POLICY "Anyone can view guitar images"
ON storage.objects FOR SELECT
USING (bucket_id = 'guitar-images');
```

## 示例数据

```sql
-- 插入示例维修订单
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
VALUES
  (
    '13800138000',
    '13800138000@phone.local',
    '13800138000',
    'acoustic',
    'Martin',
    'D-28',
    '琴颈有些弯曲，需要调整。另外弦距有点高，弹奏不太舒适。',
    '2026-01-22',
    '10:00-11:00',
    '2026-01-25'
  ),
  (
    '13900139000',
    '13900139000@phone.local',
    '13900139000',
    'electric',
    'Fender',
    'Stratocaster',
    '拾音器有杂音，需要检查电路。',
    '2026-01-22',
    '14:00-15:00',
    '2026-01-24'
  );
```

## 数据库维护

### 定期清理
```sql
-- 删除1年前已完成或已取消的订单
DELETE FROM guitar_repairs
WHERE status IN ('completed', 'cancelled')
AND updated_at < NOW() - INTERVAL '1 year';
```

### 统计查询

```sql
-- 按状态统计订单数量
SELECT status, COUNT(*) as count
FROM guitar_repairs
GROUP BY status;

-- 按吉他类型统计订单数量
SELECT guitar_type, COUNT(*) as count
FROM guitar_repairs
GROUP BY guitar_type
ORDER BY count DESC;

-- 查询最繁忙的时间段
SELECT
  appointment_time,
  COUNT(*) as booking_count
FROM guitar_repairs
WHERE appointment_date >= CURRENT_DATE
  AND status NOT IN ('cancelled')
GROUP BY appointment_time
ORDER BY booking_count DESC
LIMIT 5;
```
