"""
文件安全验证器
验证文件类型、大小、内容
"""
import zipfile
import re
from pathlib import Path
from typing import Dict, Any

class FileValidator:
    """文件安全验证器"""

    ALLOWED_EXTENSIONS = {
        'excel': ['.xlsx', '.xls', '.csv'],
        'word': ['.docx'],
    }

    MAX_FILE_SIZES = {
        'excel': 100 * 1024 * 1024,  # 100MB
        'word': 50 * 1024 * 1024,    # 50MB
    }

    # 危险模式
    DANGEROUS_PATTERNS = [
        r'vbaProject',           # VBA宏
        r'\.exe\b',              # 可执行文件
        r'<script>',             # 脚本注入
        r'eval\s*\(',           # eval执行
    ]

    def validate_excel(self, file_path: str) -> Dict[str, Any]:
        """验证Excel文件"""
        return self._validate(file_path, 'excel')

    def validate_word(self, file_path: str) -> Dict[str, Any]:
        """验证Word文件"""
        result = self._validate(file_path, 'word')

        # 额外检查Word文件中的恶意代码
        if result['valid']:
            result['malware_check'] = self._check_docx_malware(file_path)

        return result

    def _validate(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """通用验证逻辑"""
        path = Path(file_path)

        # 1. 扩展名检查
        ext = path.suffix.lower()
        allowed = self.ALLOWED_EXTENSIONS.get(file_type, [])
        if ext not in allowed:
            return {
                'valid': False,
                'error': f"不支持的文件格式: {ext}，支持的格式: {allowed}"
            }

        # 2. 文件大小检查
        max_size = self.MAX_FILE_SIZES.get(file_type, 50 * 1024 * 1024)
        if path.stat().st_size > max_size:
            return {
                'valid': False,
                'error': f"文件大小超过限制: {max_size // (1024*1024)}MB"
            }

        return {'valid': True}

    def _check_docx_malware(self, file_path: str) -> Dict[str, Any]:
        """检查DOCX中的恶意代码"""
        try:
            with zipfile.ZipFile(file_path, 'r') as zf:
                # 检查是否包含VBA宏
                dangerous_names = [n for n in zf.namelist()
                                  if 'vbaProject' in n or n.endswith('.bin')]
                if dangerous_names:
                    return {'safe': False, 'reason': '包含VBA宏代码'}

                # 检查XML内容中的危险模式
                for name in zf.namelist():
                    if name.endswith('.xml'):
                        content = zf.read(name).decode('utf-8', errors='ignore')
                        for pattern in self.DANGEROUS_PATTERNS:
                            if re.search(pattern, content, re.I):
                                return {'safe': False, 'reason': f'发现危险模式: {pattern}'}

            return {'safe': True}
        except Exception as e:
            return {'safe': False, 'reason': f'检查失败: {str(e)}'}
