"""
Excel数据处理器
支持 .xlsx, .xls, .csv 格式
支持流式读取大文件
"""
import pandas as pd
from typing import Dict, Any, List
from pathlib import Path

class ExcelProcessor:
    """Excel数据处理器"""

    SUPPORTED_FORMATS = ['.xlsx', '.xls', '.csv']

    def __init__(self, file_path: str):
        self.file_path = file_path
        self._validate_file()

    def _validate_file(self) -> None:
        """验证文件格式"""
        ext = Path(self.file_path).suffix.lower()
        if ext not in self.SUPPORTED_FORMATS:
            raise ValueError(f"不支持的文件格式: {ext}，支持的格式: {self.SUPPORTED_FORMATS}")

    def _read_file(self, **kwargs):
        """根据文件类型读取文件"""
        ext = Path(self.file_path).suffix.lower()
        if ext == '.csv':
            # 尝试多种编码，优先 UTF-8 with BOM
            for encoding in ['utf-8-sig', 'utf-8', 'gbk', 'gb2312', 'latin1']:
                try:
                    df = pd.read_csv(self.file_path, encoding=encoding, **kwargs)
                    # 跳过 BOM 行如果存在
                    if len(df) > 0 and str(df.columns[0]).startswith('﻿'):
                        df.columns = [c.lstrip('﻿') for c in df.columns]
                    return df
                except UnicodeDecodeError:
                    continue
            # 如果都失败，使用 latin1
            return pd.read_csv(self.file_path, encoding='latin1', **kwargs)
        else:
            return pd.read_excel(self.file_path, **kwargs)

    def read_headers(self) -> List[str]:
        """读取Excel表头（第一行）"""
        df = self._read_file(header=0, nrows=0)
        return df.columns.tolist()

    def read_data(self, skip_rows: int = 1) -> pd.DataFrame:
        """读取Excel数据（跳过第一行说明行）"""
        df = self._read_file(header=0)
        return df.iloc[skip_rows:]  # 跳过第一行说明行

    def get_row_count(self) -> int:
        """获取数据行数（跳过第一行说明行）"""
        df = self._read_file(header=0)
        return len(df) - 1  # 减1是因为跳过说明行

    def get_data_preview(self, rows: int = 10) -> List[Dict[str, Any]]:
        """获取数据预览（跳过第一行说明行，从第二行开始）"""
        df = self._read_file(header=0)
        df = df.iloc[1:rows+1]  # 跳过第一行说明行，取接下来的rows行
        return df.to_dict('records')
