'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button, Input, Form, message } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useLoginLog } from '@/hooks/useLoginLog';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { recordLoginLog } = useLoginLog();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        message.error('登录失败，请检查您的邮箱和密码');
        return;
      }

      // 记录登录日志
      await recordLoginLog();
      
      message.success('登录成功');
      router.push('/admin');
    } catch (error) {
      message.error('登录过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const loginScreenStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#fff',
  };
  
  const viewStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
  };
  
  const pageStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  };
  
  const navbarStyle: React.CSSProperties = {
    background: '#2196f3',
    color: '#fff',
    height: '56px',
    position: 'relative',
  };
  
  const navbarBgStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    background: '#2196f3',
  };
  
  const navbarInnerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    zIndex: 10,
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: 600,
  };
  
  const pageContentStyle: React.CSSProperties = {
    padding: '30px 16px',
  };
  
  const loginScreenContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };
  
  const loginScreenTitleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#000',
  };
  
  const loginScreenSubtitleStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#666',
    marginBottom: '40px',
  };
  
  const formStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '20px',
  };
  
  const inputStyle: React.CSSProperties = {
    borderRadius: '8px',
    border: '1px solid #c8c8cd',
  };
  
  const buttonStyle: React.CSSProperties = {
    background: '#2196f3',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    height: '48px',
    fontSize: '16px',
  };
  
  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '20px',
  };
  
  const footerTextStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  };

  return (
    <div style={loginScreenStyle}>
      <div style={viewStyle}>
        <div style={pageStyle}>
          <div style={navbarStyle}>
            <div style={navbarBgStyle}></div>
            <div style={navbarInnerStyle}>
              <div style={titleStyle}>登录</div>
            </div>
          </div>
          <div style={pageContentStyle}>
            <div style={loginScreenContentStyle}>
              <div style={loginScreenTitleStyle}>LACS Admin</div>
              <div style={loginScreenSubtitleStyle}>管理员控制台</div>
              
              <Form
                name="login"
                onFinish={onFinish}
                autoComplete="off"
                style={formStyle}
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入您的邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="邮箱"
                    size="large"
                    style={inputStyle}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入您的密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    size="large"
                    style={inputStyle}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    style={buttonStyle}
                    block
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>
              
              <div style={footerStyle}>
                <p style={footerTextStyle}>安全提示：请使用管理员账号登录</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}