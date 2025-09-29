import { redirect } from 'next/navigation';

export default function AboutUsPage() {
  // 重定向到联系方式页面作为默认页面
  redirect('/aboutus/contact');
}
