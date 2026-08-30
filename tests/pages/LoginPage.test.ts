// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import LoginPage from '../../src/pages/LoginPage.vue';
import { useAuthStore } from '../../src/stores/auth';

describe('LoginPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders login form elements and wordmark', () => {
    const wrapper = mount(LoginPage);
    expect(wrapper.find('h1').text()).toContain('Матрица компетенций');
    expect(wrapper.find('input#login-email').exists()).toBe(true);
    expect(wrapper.find('input#login-password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toContain('Войти');
  });

  it('validates empty inputs on submit', async () => {
    const wrapper = mount(LoginPage);
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('[aria-live="polite"]').text()).toContain('Заполните email и пароль');
  });

  it('calls authStore.signInWithPassword on valid submit and displays error on failure', async () => {
    const authStore = useAuthStore();
    const signInSpy = vi.spyOn(authStore, 'signInWithPassword').mockResolvedValueOnce({
      ok: false,
      error: 'Неверный email или пароль',
    });

    const wrapper = mount(LoginPage);
    await wrapper.find('input#login-email').setValue('user@example.com');
    await wrapper.find('input#login-password').setValue('wrongpassword');
    await wrapper.find('form').trigger('submit.prevent');

    expect(signInSpy).toHaveBeenCalledWith('user@example.com', 'wrongpassword');
    expect(wrapper.find('[aria-live="polite"]').text()).toContain('Неверный email или пароль');
  });
});
