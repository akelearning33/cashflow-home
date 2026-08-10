# CashFlow Home

เว็บบันทึกรายรับ–รายจ่ายสำหรับสมาชิกในบ้าน โดยข้อมูลธุรกรรมของแต่ละบัญชีแยกจากกัน ผู้ดูแลระบบมีหน้าที่เชิญและจัดการสมาชิก รวมถึงดูแลหมวดหมู่มาตรฐาน

## เริ่มต้นใช้งาน

1. คัดลอก `.env.example` เป็น `.env` และใส่ `VITE_SUPABASE_URL` กับ `VITE_SUPABASE_ANON_KEY`
2. ติดตั้ง dependency ด้วย `npm install`
3. รัน migration ใน `supabase/migrations` ตามลำดับ โดย `003_ux_foundation.sql` จะ backfill หมวดหมู่เดิมโดยไม่ลบข้อความเก่า
4. Deploy Edge Functions `invite-user` และ `delete-user` พร้อมตั้งค่า secret key ของ Supabase
5. รันแอปด้วย `npm run dev`

## ตั้งค่า Auth แบบเชิญเท่านั้น

- ใน Supabase Dashboard ไปที่ **Authentication → Sign In / Providers** แล้วปิด **Allow new users to sign up**
- เปิด Email และ Google provider ตามที่ต้องการ ผู้ใช้ Google ที่มีอีเมลตรงกับบัญชีที่ได้รับเชิญจะถูกเชื่อมกับบัญชีเดิม
- เพิ่ม URL ของ production และ `http://localhost:5173/set-password` ใน Redirect URLs
- ตั้งค่า Site URL ให้ตรงกับโดเมน production
- `supabase/config.toml` ตั้ง `auth.enable_signup = false` ไว้แล้วสำหรับ local environment

> การปิด signup ในไฟล์ local config ไม่ได้แก้ค่าของ hosted project อัตโนมัติ ต้องปิดใน Dashboard ก่อนเปิดใช้ production

## คำสั่งตรวจสอบ

```bash
npm run lint
npm test
npm run build
```

## โครงสร้างข้อมูลสำคัญ

- `transactions.category_id` เชื่อมธุรกรรมกับหมวดหมู่ ส่วน `category` เดิมเก็บไว้เป็น fallback
- `transactions.deleted_at` รองรับ soft delete และ Undo
- `categories.is_active` ใช้เก็บถาวร/กู้คืนหมวดหมู่โดยไม่ทำลายประวัติ
- RLS อนุญาตให้สมาชิกและผู้ดูแลระบบอ่านธุรกรรมของตนเองเท่านั้น
