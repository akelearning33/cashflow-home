# CashFlow Home

เว็บบันทึกรายรับ–รายจ่ายสำหรับสมาชิกในบ้าน โดยข้อมูลธุรกรรมของแต่ละบัญชีแยกจากกัน ผู้ดูแลระบบมีหน้าที่เชิญและจัดการสมาชิก รวมถึงดูแลหมวดหมู่มาตรฐาน

## เริ่มต้นใช้งาน

1. คัดลอก `.env.example` เป็น `.env` และใส่ `VITE_SUPABASE_URL` กับ `VITE_SUPABASE_ANON_KEY`
2. ติดตั้ง dependency ด้วย `npm install`
3. รัน migration ใน `supabase/migrations` ตามลำดับ โดย `003_ux_foundation.sql` จะ backfill หมวดหมู่เดิมโดยไม่ลบข้อความเก่า และ `20260921003220_recurring_transactions.sql` จะเพิ่มรายการประจำพร้อมงาน Supabase Cron วันละครั้ง เวลา 00:05 น. ตามเวลาไทย
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
- `recurring_transactions` เก็บรายการรับ–จ่ายรายเดือน ส่วนรายการที่สร้างจริงจะอ้างอิงด้วย `transactions.recurring_transaction_id` และ `transactions.recurring_month` เพื่อป้องกันการสร้างซ้ำ
- RLS อนุญาตให้สมาชิกและผู้ดูแลระบบอ่านธุรกรรมของตนเองเท่านั้น

## รายการประจำ

หน้า **รายการประจำ** รองรับรายรับและรายจ่ายยอดคงที่รายเดือน เช่น ค่าเช่าคอนโดทุกวันที่ 27 หรือค่ามือถือทุกวันที่ 3 ระบบใช้วันสุดท้ายของเดือนเมื่อกำหนดวันที่ 29–31 ในเดือนที่สั้นกว่า และจะสร้างงวดที่ค้างให้เมื่อกลับมาเปิดแอป

Migration จะเปิดใช้ `pg_cron` และตั้งงานชื่อ `cashflow-process-recurring` ให้อัตโนมัติ หากโปรเจกต์ยังไม่เปิดใช้ Cron ให้เปิด `pg_cron` ใน Supabase Dashboard แล้วรันคำสั่งตั้งงานนี้ใน SQL Editor:

```sql
select cron.schedule(
  'cashflow-process-recurring',
  '5 17 * * *', -- 17:05 UTC = 00:05 Asia/Bangkok
  $$select private.process_recurring_transactions();$$
);
```

หากเคยตั้งงานทุก 5 นาทีไว้แล้ว ให้รันคำสั่งข้างต้นด้วยชื่อเดิมเพื่อเปลี่ยนเป็นวันละครั้ง โดยไม่เพิ่มงานซ้ำ
