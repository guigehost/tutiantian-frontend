"""
Word文档处理器
基于python-docx
"""
from docx import Document
from typing import Dict, Any, List
from pathlib import Path
from .placeholder_engine import PlaceholderEngine

class WordProcessor:
    """Word文档处理器"""

    SUPPORTED_FORMATS = ['.docx']

    def __init__(self):
        self.engine = PlaceholderEngine()

    def extract_placeholders(self, template_path: str) -> List[str]:
        """提取模板中的占位符"""
        return self.engine.extract_placeholders(template_path)

    def fill_and_save(
        self,
        template_path: str,
        data: Dict[str, Any],
        output_path: str,
        formats: Dict[str, Dict] = None
    ) -> bool:
        """填充模板并保存"""
        return self.engine.fill_template(template_path, data, output_path, formats)
