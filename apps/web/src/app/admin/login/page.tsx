'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { ErrorMessage } from '@/components/states';
import { Button } from '@/components/ui/button';
import { CpuMark } from '@/components/cpu-mark';
const schema = z.object({
  email: z.email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z.string().min(12, 'รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร').max(72, 'รหัสผ่านยาวเกินไป'),
});
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <div className="login-wrap panel">
      <CpuMark className="text-cyan-300 cpu-mark-on-dark" size={38} />
      <h1>เข้าสู่ระบบผู้ดูแล</h1>
      <p>จัดการสินค้า แหล่งราคา และตรวจสอบการทำงานของระบบ</p>
      <form
        onSubmit={handleSubmit(async (values) => {
          setError('');
          try {
            await api('/auth/login', { method: 'POST', body: JSON.stringify(values) });
            router.replace('/admin');
          } catch (err) {
            setError((err as Error).message);
          }
        })}
      >
        <label className="field">
          อีเมล
          <input
            {...register('email')}
            autoComplete="username"
            type="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>
        <label className="field">
          รหัสผ่าน
          <input
            {...register('password')}
            autoComplete="current-password"
            type="password"
            aria-invalid={!!errors.password}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>
        {error && <ErrorMessage message={error} />}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <LoaderCircle className="spin" /> : <ArrowRight />}เข้าสู่ระบบ
        </Button>
      </form>
    </div>
  );
}
