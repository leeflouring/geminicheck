const apiKeysInput = document.getElementById('apiKeysInput');
const checkButton = document.getElementById('checkButton');
const statusDiv = document.getElementById('status');
const validKeysOutput = document.getElementById('validKeysOutput');
const invalidKeysOutput = document.getElementById('invalidKeysOutput');

checkButton.addEventListener('click', handleCheck);

async function handleCheck() {
    const rawKeys = apiKeysInput.value.trim();
    if (!rawKeys) {
        statusDiv.textContent = '请输入至少一个 API 密钥。';
        return;
    }

    const apiKeys = rawKeys.split('\n').map(key => key.trim()).filter(key => key !== '');
    if (apiKeys.length === 0) {
        statusDiv.textContent = '请输入有效的 API 密钥。';
        return;
    }

    setLoadingState(true);

    try {
        const response = await fetch('/check-keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ apiKeys }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '无法解析错误响应' }));
            throw new Error(`HTTP 错误! 状态: ${response.status} - ${errorData.error || '未知错误'}`);
        }

        const result = await response.json();
        displayResults(result.validKeys, result.invalidKeys);

    } catch (error) {
        console.error('检查密钥时出错:', error);
        statusDiv.textContent = `错误: ${error.message}`;
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    if (isLoading) {
        statusDiv.textContent = '测试中...';
        checkButton.disabled = true;
        checkButton.textContent = '正在测试...';
        validKeysOutput.value = '';
        invalidKeysOutput.value = '';
    } else {
        statusDiv.textContent = '测试完成。';
        checkButton.disabled = false;
        checkButton.textContent = '开始测试';
    }
}

function displayResults(validKeys, invalidKeys) {
    validKeysOutput.value = validKeys.join('\n');
    invalidKeysOutput.value = invalidKeys.join('\n');
    statusDiv.textContent = `测试完成：${validKeys.length} 个有效，${invalidKeys.length} 个无效。`;
}

document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const textarea = document.getElementById(targetId);
        if (textarea.value) {
            navigator.clipboard.writeText(textarea.value)
                .then(() => {
                    const originalText = e.target.textContent;
                    e.target.textContent = '已复制!';
                    setTimeout(() => e.target.textContent = originalText, 2000);
                })
                .catch(err => console.error('无法复制文本: ', err));
        }
    });
});

document.querySelectorAll('.export-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const filename = e.target.dataset.filename;
        const textarea = document.getElementById(targetId);
        if (textarea.value) {
            const blob = new Blob([textarea.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });
});