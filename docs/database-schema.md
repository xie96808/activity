# 数据库设计文档

本文档描述了音乐活动预约平台的数据库结构设计。

## 数据库技术

- **数据库**: PostgreSQL (通过Supabase)
- **ORM**: Supabase Client
- **认证**: Supabase Auth

## 数据表结构

### 1. users (用户表)

由Supabase Auth自动管理，包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 用户ID（主键） |
| email | varchar | 邮箱地址 |
| created_at | timestamp | 创建时间 |
| user_metadata | jsonb | 用户元数据（姓名、电话等） |

**user_metadata 结构**:
```json
{
  "name": "用户姓名",
  "phone": "电话号码"
}
```

### 2. activities (活动表)

存储所有音乐活动信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 活动ID |
| title | varchar(255) | NOT NULL | 活动标题 |
| description | text | NOT NULL | 活动描述 |
| category | varchar(50) | NOT NULL | 活动类型（course/concert/workshop） |
| date | date | NOT NULL | 活动日期 |
| time | varchar(50) | NOT NULL | 活动时间 |
| location | varchar(255) | NOT NULL | 活动地点 |
| capacity | integer | NOT NULL | 总名额 |
| booked_count | integer | DEFAULT 0 | 已预约人数 |
| image_url | varchar(500) | | 活动图片URL |
| created_at | timestamp | DEFAULT now() | 创建时间 |
| updated_at | timestamp | DEFAULT now() | 更新时间 |

**SQL创建语句**:
```sql
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar(255) NOT NULL,
  description text NOT NULL,
  category varchar(50) NOT NULL CHECK (category IN ('course', 'concert', 'workshop')),
  date date NOT NULL,
  time varchar(50) NOT NULL,
  location varchar(255) NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  booked_count integer DEFAULT 0 CHECK (booked_count >= 0),
  image_url varchar(500),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_category ON activities(category);
```

### 3. bookings (预约表)

存储用户的活动预约信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 预约ID |
| activity_id | uuid | FOREIGN KEY REFERENCES activities(id) | 活动ID |
| user_id | uuid | FOREIGN KEY REFERENCES auth.users(id) | 用户ID（可为空，支持游客预约） |
| user_name | varchar(100) | NOT NULL | 预约人姓名 |
| user_email | varchar(255) | NOT NULL | 预约人邮箱 |
| user_phone | varchar(20) | NOT NULL | 预约人电话 |
| booking_date | date | NOT NULL | 预约的活动日期 |
| participant_count | integer | NOT NULL | 参与人数 |
| notes | text | | 备注信息 |
| status | varchar(20) | DEFAULT 'pending' | 预约状态（pending/confirmed/cancelled） |
| created_at | timestamp | DEFAULT now() | 创建时间 |
| updated_at | timestamp | DEFAULT now() | 更新时间 |

**SQL创建语句**:
```sql
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name varchar(100) NOT NULL,
  user_email varchar(255) NOT NULL,
  user_phone varchar(20) NOT NULL,
  booking_date date NOT NULL,
  participant_count integer NOT NULL CHECK (participant_count > 0 AND participant_count <= 10),
  notes text,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_bookings_activity_id ON bookings(activity_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### 4. activity_schedules (活动排期表) - 可选

用于管理活动的多个时间段和名额。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 排期ID |
| activity_id | uuid | FOREIGN KEY REFERENCES activities(id) | 活动ID |
| date | date | NOT NULL | 日期 |
| available_slots | integer | NOT NULL | 可用名额 |
| booked_slots | integer | DEFAULT 0 | 已预约名额 |
| created_at | timestamp | DEFAULT now() | 创建时间 |

**SQL创建语句**:
```sql
CREATE TABLE activity_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  date date NOT NULL,
  available_slots integer NOT NULL CHECK (available_slots > 0),
  booked_slots integer DEFAULT 0 CHECK (booked_slots >= 0),
  created_at timestamp DEFAULT now(),
  UNIQUE(activity_id, date)
);

-- 创建索引
CREATE INDEX idx_activity_schedules_activity_id ON activity_schedules(activity_id);
CREATE INDEX idx_activity_schedules_date ON activity_schedules(date);
```

## 数据库触发器

### 1. 更新活动预约人数

当创建或取消预约时，自动更新活动的已预约人数。

```sql
-- 创建函数：更新活动预约人数
CREATE OR REPLACE FUNCTION update_activity_booked_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- 新增预约
    UPDATE activities
    SET booked_count = booked_count + NEW.participant_count
    WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      -- 取消预约
      UPDATE activities
      SET booked_count = booked_count - OLD.participant_count
      WHERE id = OLD.activity_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_activity_booked_count
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_activity_booked_count();
```

### 2. 更新时间戳

自动更新记录的 updated_at 字段。

```sql
-- 创建函数：更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为activities表创建触发器
CREATE TRIGGER trigger_update_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为bookings表创建触发器
CREATE TRIGGER trigger_update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS) 策略

Supabase使用RLS来控制数据访问权限。

### activities表策略

```sql
-- 启用RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看活动
CREATE POLICY "Anyone can view activities"
ON activities FOR SELECT
USING (true);

-- 只有管理员可以创建、更新、删除活动（需要自定义角色）
-- 这里暂时允许认证用户操作，实际应用中需要更严格的权限控制
CREATE POLICY "Authenticated users can insert activities"
ON activities FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update activities"
ON activities FOR UPDATE
TO authenticated
USING (true);
```

### bookings表策略

```sql
-- 启用RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的预约
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- 任何人都可以创建预约（包括游客）
CREATE POLICY "Anyone can create bookings"
ON bookings FOR INSERT
WITH CHECK (true);

-- 用户只能更新自己的预约
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = user_id);
```

## 示例数据

### 插入示例活动

```sql
INSERT INTO activities (title, description, category, date, time, location, capacity, image_url)
VALUES
  ('吉他入门课程', '适合零基础学员的吉他入门课程，学习基本和弦和简单曲目', 'course', '2026-02-15', '14:00-16:00', '音乐教室A', 10, 'images/guitars/course1.jpg'),
  ('古典吉他音乐会', '欣赏专业吉他手演奏经典曲目', 'concert', '2026-02-20', '19:00-21:00', '音乐厅', 50, 'images/guitars/concert1.jpg'),
  ('指弹吉他工作坊', '学习指弹技巧和编曲方法', 'workshop', '2026-02-25', '10:00-12:00', '音乐教室B', 15, 'images/guitars/workshop1.jpg');
```

## 数据库维护

### 定期清理

建议定期清理已取消的旧预约记录：

```sql
-- 删除6个月前已取消的预约
DELETE FROM bookings
WHERE status = 'cancelled'
AND updated_at < NOW() - INTERVAL '6 months';
```

### 备份策略

Supabase提供自动备份功能，建议：
- 启用每日自动备份
- 定期导出重要数据
- 测试恢复流程

## 性能优化建议

1. **索引优化**: 已为常用查询字段创建索引
2. **查询优化**: 使用Supabase的查询构建器，避免N+1查询
3. **缓存策略**: 对不常变化的数据（如活动列表）使用客户端缓存
4. **分页**: 活动列表和预约记录使用分页加载

## 扩展建议

未来可以考虑添加以下表：

1. **reviews** - 用户评价表
2. **favorites** - 收藏表
3. **notifications** - 通知表
4. **activity_images** - 活动多图表
5. **instructors** - 教师信息表
