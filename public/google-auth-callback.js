// 从URL参数中提取授权码或错误信息
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const error = urlParams.get('error');
const state = urlParams.get('state');

console.log('URL params - code:', code, 'error:', error, 'state:', state);

if (code) {
    console.log('Sending success message to parent window');
    // 成功获取授权码，发送给父窗口
    const message = {
        type: 'google-oauth-code',
        code: code,
        state: state
    };
    console.log('Message to send:', message);
    window.opener.postMessage(message, window.location.origin);
} else if (error) {
    // 授权失败，发送错误信息给父窗口
    window.opener.postMessage({
        type: 'google-oauth-error',
        error: error,
        error_description: urlParams.get('error_description')
    }, window.location.origin);
} else {
    // 未知情况
    window.opener.postMessage({
        type: 'google-oauth-error',
        error: 'unknown_error',
        error_description: 'No code or error parameter found'
    }, window.location.origin);
}

// 关闭当前窗口
window.close();