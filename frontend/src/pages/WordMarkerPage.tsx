import React, { useState, useRef, useEffect } from 'react';
import { Card, Typography, Upload, Button, Input, Table, Space, Tag, message, Row, Col, Divider, Modal, Spin, Radio, Tooltip, Alert, Select, Popover } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, PlusOutlined, FileWordOutlined, ClearOutlined, SaveOutlined, FormatPainterOutlined, HomeOutlined } from '@ant-design/icons';
import * as docx from 'docx-preview';
import { templateApi } from '../api/client';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface Field {
  id: number;
  fieldName: string;
  originalText: string;
  placeholder: string;
  status: 'pending' | 'synced' | 'failed';
  fontName?: string;
  fontSize?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  alignment?: string;
}

interface CellPosition {
  tableIndex: number;
  row: number;
  col: number;
}

interface FieldFormat {
  fontName: string;
  fontSize: string;
  bold: boolean;
  italic: boolean;
  color: string;
  alignment: string;
}

const defaultFormat: FieldFormat = {
  fontName: '宋体',
  fontSize: '五号',
  bold: false,
  italic: false,
  color: '#000000',
  alignment: 'left'
};

const fontOptions = [
  { value: '宋体', label: '宋体' },
  { value: '黑体', label: '黑体' },
  { value: '微软雅黑', label: '微软雅黑' },
  { value: '楷体', label: '楷体' },
  { value: '仿宋', label: '仿宋' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
];

const fontSizeOptions = [
  { value: '八号', label: '八号 (5pt)' },
  { value: '七号', label: '七号 (8pt)' },
  { value: '六号', label: '六号 (8.7pt)' },
  { value: '五号', label: '五号 (10.5pt)' },
  { value: '小五', label: '小五 (9pt)' },
  { value: '四号', label: '四号 (14pt)' },
  { value: '小三', label: '小三 (15pt)' },
  { value: '小四', label: '小四 (12pt)' },
  { value: '三号', label: '三号 (16pt)' },
  { value: '二号', label: '二号 (22pt)' },
  { value: '一号', label: '一号 (26pt)' },
];

const alignmentOptions = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
];

const colorOptions = [
  { value: '#000000', label: '黑色' },
  { value: '#FF0000', label: '红色' },
  { value: '#00FF00', label: '绿色' },
  { value: '#0000FF', label: '蓝色' },
  { value: '#FFFF00', label: '黄色' },
  { value: '#FF00FF', label: '紫色' },
  { value: '#00FFFF', label: '青色' },
  { value: '#FFFFFF', label: '白色' },
];

export default function WordMarkerPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [markMode, setMarkMode] = useState<'replace' | 'insert'>('replace');
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplateId, setSavedTemplateId] = useState<number | null>(null);
  const [fieldFormat, setFieldFormat] = useState<FieldFormat>(defaultFormat);
  const previewRef = useRef<HTMLDivElement>(null);

  // 处理Word文件上传
  const handleUpload = async (uploadFile: File) => {
    if (!uploadFile.name.endsWith('.docx')) {
      message.error('只支持 .docx 格式');
      return false;
    }

    setUploading(true);
    setFile(uploadFile);
    setFields([]);
    setTemplateId(null);
    setSelectedCell(null);
    setSelectedText('');
    setTemplateName('');
    setSavedTemplateId(null);

    try {
      // 1. 先上传到后端保存
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadFile.name.replace('.docx', ''));

      const res = await templateApi.upload(formData);
      const tid = res.data.template_id;
      setTemplateId(tid);

      // 2. 预览Word文档
      const arrayBuffer = await uploadFile.arrayBuffer();
      if (previewRef.current) {
        previewRef.current.innerHTML = '';
        await docx.renderAsync(arrayBuffer, previewRef.current, undefined, {
          className: 'docx-preview',
          inWrapper: true,
        });
        // 清除之前的高亮
        previewRef.current.querySelectorAll('.cell-selected').forEach(el => el.classList.remove('cell-selected'));
      }

      message.success('Word文档加载成功，请选择文本进行标记');
    } catch (e: any) {
      console.error(e);
      message.error(e.response?.data?.detail || 'Word文档解析失败');
    } finally {
      setUploading(false);
    }

    return false;
  };

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);
      setFieldName('');
      setSelectedCell(null); // 清除单元格选择
    }
  };

  // 处理表格单元格点击
  const handleCellClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 找到最近的 TD 元素（可能点击的是 TD 内部的 P、SPAN 等）
    const td = target.closest('td') as HTMLTableCellElement | null;
    if (!td) return;

    const table = td.closest('table');
    if (!table) return;

    // 计算表格索引（文档中可能有多个表格）
    const tables = previewRef.current?.querySelectorAll('table') || [];
    const tableIndex = Array.from(tables).indexOf(table);

    const tr = td.closest('tr') as HTMLTableRowElement;
    if (!tr) return;

    // 计算行索引和列索引
    const row = Array.from(table.rows).indexOf(tr);
    const col = Array.from(tr.cells).indexOf(td);

    setSelectedCell({ tableIndex, row, col });
    setSelectedText(''); // 清除文本选择
    setFieldName('');

    // 高亮显示选中单元格
    highlightCell(td);
  };

  // 高亮选中单元格
  const highlightCell = (cell: HTMLElement) => {
    // 移除之前的高亮
    const prevHighlighted = previewRef.current?.querySelectorAll('.cell-selected');
    prevHighlighted?.forEach(el => el.classList.remove('cell-selected'));

    // 添加新的高亮
    cell.classList.add('cell-selected');
  };

  // 添加字段（同步到后端）
  const handleAddField = async () => {
    if (!fieldName.trim()) {
      message.warning('请输入字段名称');
      return;
    }

    if (fields.some(f => f.fieldName === fieldName.trim())) {
      message.warning('字段名称已存在');
      return;
    }

    if (!templateId) {
      message.warning('请先上传Word文档');
      return;
    }

    if (markMode === 'replace' && !selectedText) {
      message.warning('请先在文档中选择要替换的文本');
      return;
    }

    if (markMode === 'insert' && !selectedCell && markMode === 'insert') {
      message.warning('请先点击表格中的单元格来选择插入位置');
      return;
    }

    setLoading(true);
    try {
      let newField: Field;

      if (markMode === 'replace') {
        // 替换模式：替换选中的文本
        await templateApi.markField(templateId, selectedText, fieldName.trim(), fieldFormat);
        newField = {
          id: Date.now(),
          fieldName: fieldName.trim(),
          originalText: selectedText,
          placeholder: `{{${fieldName.trim()}}}`,
          status: 'synced',
          ...fieldFormat
        };
        setSelectedText('');
      } else {
        // 插入模式：在指定表格单元格中插入占位符
        await templateApi.insertField(
          templateId,
          fieldName.trim(),
          'table',
          selectedCell!.tableIndex,
          selectedCell!.row,
          selectedCell!.col,
          fieldFormat
        );
        newField = {
          id: Date.now(),
          fieldName: fieldName.trim(),
          originalText: `[表格${selectedCell!.tableIndex + 1} 第${selectedCell!.row + 1}行 第${selectedCell!.col + 1}列]`,
          placeholder: `{{${fieldName.trim()}}}`,
          status: 'synced',
          ...fieldFormat
        };
        setSelectedCell(null);
      }

      setFields([...fields, newField]);
      setFieldName('');
      message.success(`字段 "${newField.fieldName}" 已添加并保存到文档`);

      // 清除选择
      window.getSelection()?.removeAllRanges();

      // 重新渲染预览 - 从后端下载标记后的文件
      try {
        const res = await templateApi.downloadMarked(templateId);
        const blob = new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const arrayBuffer = await blob.arrayBuffer();
        if (previewRef.current) {
          previewRef.current.innerHTML = '';
          await docx.renderAsync(arrayBuffer, previewRef.current, undefined, {
            className: 'docx-preview',
            inWrapper: true,
          });
          // 更新本地文件引用，用于后续预览
          const newFile = new File([blob], file?.name || 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          setFile(newFile);
        }
      } catch (e) {
        console.error('预览更新失败:', e);
      }
    } catch (e: any) {
      console.error(e);
      message.error(e.response?.data?.detail || '标记失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除字段
  const handleDeleteField = (id: number) => {
    setFields(fields.filter(f => f.id !== id));
    message.info('字段已从列表移除（文档中的修改需要重新上传文件）');
  };

  // 清空所有
  const handleClearAll = () => {
    if (fields.length === 0) return;
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有已标记的字段吗？',
      onOk: () => {
        setFields([]);
        message.success('已清空所有字段');
      }
    });
  };

  // 保存模板并生成CSV
  const handleSaveTemplate = async () => {
    if (fields.length === 0) {
      message.warning('请先添加字段');
      return;
    }

    if (!templateId) {
      message.warning('请先上传Word文档');
      return;
    }

    if (!templateName.trim()) {
      message.warning('请输入模板名称');
      return;
    }

    setLoading(true);
    try {
      const res = await templateApi.saveTemplate(templateId, templateName.trim());
      setSavedTemplateId(templateId);
      message.success('模板已保存！去创建任务使用它吧');
    } catch (e: any) {
      console.error(e);
      message.error(e.response?.data?.detail || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 下载CSV模板
  const handleDownloadCsv = () => {
    if (fields.length === 0) {
      message.warning('请先添加字段');
      return;
    }

    const header = fields.map(f => f.fieldName).join(',');
    const sampleRow = fields.map(f => `"${f.originalText.replace(/"/g, '""')}"`).join(',');
    // 使用 TextEncoder 确保 UTF-8 编码
    const csvContent = '﻿' + header + '\n' + sampleRow + '\n';  // ﻿ 是 BOM 字符
    const blob = new Blob([new TextEncoder().encode(csvContent)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `填充模板_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    message.success('Excel模板已下载');
  };

  const columns = [
    {
      title: '字段名称',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 120,
      render: (text: string, record: Field) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue">{record.placeholder}</Tag>
          {record.status === 'synced' && <Tag color="green" style={{ fontSize: 10 }}>已保存</Tag>}
        </Space>
      )
    },
    {
      title: '原文预览',
      dataIndex: 'originalText',
      key: 'originalText',
      ellipsis: true,
      width: 150
    },
    {
      title: '字体格式',
      key: 'format',
      width: 220,
      render: (_: any, record: Field) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <Tag style={{ fontFamily: record.fontName, margin: 0 }}>{record.fontName}</Tag>
            <Tag style={{ margin: 0 }}>{record.fontSize}</Tag>
          </Space>
          <Space size={4}>
            {record.bold ? <Tag color="gold" style={{ margin: 0 }}>加粗</Tag> : null}
            {record.italic ? <Tag color="purple" style={{ margin: 0 }}>斜体</Tag> : null}
            <Tag style={{ backgroundColor: record.color, color: '#fff', border: 'none', margin: 0 }}>
              {record.color}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Field) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteField(record.id)}
        >
          删除
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>返回首页</Button>
      </div>

      <Title level={3}>Word模板标记工具</Title>
      <Text type="secondary">上传Word文档，选中文本或点击表格单元格标记为可填充字段，生成带占位符的模板</Text>

      <Row gutter={24} style={{ marginTop: 24 }}>
        {/* 左侧：Word预览 */}
        <Col span={14}>
          <Card
            title={
              <Space>
                <FileWordOutlined />
                <span>Word文档预览</span>
              </Space>
            }
            extra={
              <Upload
                accept=".docx"
                showUploadList={false}
                beforeUpload={handleUpload}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>上传Word</Button>
              </Upload>
            }
          >
            <Spin spinning={uploading}>
              <div
                ref={previewRef}
                className="word-preview"
                style={{
                  minHeight: 400,
                  maxHeight: 600,
                  overflow: 'auto',
                  border: '1px solid #f0f0f0',
                  padding: 16,
                  background: '#fff'
                }}
                onMouseUp={handleTextSelection}
                onClick={handleCellClick}
              >
                {!file ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <UploadOutlined style={{ fontSize: 48, color: '#ccc' }} />
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary">请上传Word文档开始标记</Text>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>
                    <Text type="secondary">
                      选择模式：选中文本替换 | 插入模式：点击表格单元格插入占位符
                    </Text>
                  </div>
                )}
              </div>
            </Spin>
          </Card>
        </Col>

        {/* 右侧：字段标记 */}
        <Col span={10}>
          {/* 选中内容 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 12 }}>
              <Radio.Group
                value={markMode}
                onChange={e => {
                  setMarkMode(e.target.value);
                  setSelectedText('');
                  setSelectedCell(null);
                }}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="replace">
                  <Tooltip title="替换文档中选中的文本为占位符">替换文本</Tooltip>
                </Radio.Button>
                <Radio.Button value="insert">
                  <Tooltip title="点击表格单元格，在该位置插入占位符">插入到单元格</Tooltip>
                </Radio.Button>
              </Radio.Group>
            </Space>

            {markMode === 'replace' ? (
              <div
                style={{
                  padding: 12,
                  background: selectedText ? '#e6f7ff' : '#f5f5f5',
                  borderRadius: 4,
                  marginBottom: 12,
                  minHeight: 40,
                  border: '1px dashed ' + (selectedText ? '#1890ff' : '#d9d9d9')
                }}
              >
                {selectedText ? (
                  <Text mark>"{selectedText}"</Text>
                ) : (
                  <Text type="secondary">在左侧文档中选择要替换的文本</Text>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: 12,
                  background: selectedCell ? '#e6f7ff' : '#f5f5f5',
                  borderRadius: 4,
                  marginBottom: 12,
                  minHeight: 40,
                  border: '1px dashed ' + (selectedCell ? '#1890ff' : '#d9d9d9')
                }}
              >
                {selectedCell ? (
                  <Text>
                    <Tag color="blue">表格{selectedCell.tableIndex + 1}</Tag>
                    <Tag color="green">第{selectedCell.row + 1}行 第{selectedCell.col + 1}列</Tag>
                    <Text type="secondary"> - 点击"添加"插入占位符</Text>
                  </Text>
                ) : (
                  <Text type="secondary">点击表格中的单元格选择插入位置</Text>
                )}
              </div>
            )}

            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder={markMode === 'replace' ? "输入字段名称，替换选中文本" : "输入字段名称，在单元格插入占位符"}
                value={fieldName}
                onChange={e => setFieldName(e.target.value)}
                onPressEnter={handleAddField}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddField}
                loading={loading}
              >
                添加
              </Button>
            </Space.Compact>

            {/* 格式配置 */}
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space style={{ marginBottom: 8 }}>
                <FormatPainterOutlined />
                <Text strong>字段格式设置</Text>
              </Space>
              <Row gutter={8}>
                <Col span={12}>
                  <Select
                    value={fieldFormat.fontName}
                    onChange={v => setFieldFormat({ ...fieldFormat, fontName: v })}
                    options={fontOptions}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Select
                    value={fieldFormat.fontSize}
                    onChange={v => setFieldFormat({ ...fieldFormat, fontSize: v })}
                    options={fontSizeOptions}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Col>
              </Row>
              <Row gutter={8} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Select
                    value={fieldFormat.alignment}
                    onChange={v => setFieldFormat({ ...fieldFormat, alignment: v })}
                    options={alignmentOptions}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Select
                    value={fieldFormat.color}
                    onChange={v => setFieldFormat({ ...fieldFormat, color: v })}
                    options={colorOptions}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Col>
              </Row>
              <Space style={{ marginTop: 8 }}>
                <Button
                  type={fieldFormat.bold ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setFieldFormat({ ...fieldFormat, bold: !fieldFormat.bold })}
                >
                  加粗
                </Button>
                <Button
                  type={fieldFormat.italic ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setFieldFormat({ ...fieldFormat, italic: !fieldFormat.italic })}
                >
                  斜体
                </Button>
              </Space>
              {/* 格式预览 */}
              <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 4, border: '1px dashed #ccc' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>格式预览：</Text>
                <div style={{
                  marginTop: 8,
                  fontFamily: fieldFormat.fontName,
                  fontSize: (parseInt(fontSizeOptions.find(f => f.value === fieldFormat.fontSize)?.label.match(/\((\d+)pt\)/)?.[1] || '10') || 10) + 'pt',
                  fontWeight: fieldFormat.bold ? 'bold' : 'normal',
                  fontStyle: fieldFormat.italic ? 'italic' : 'normal',
                  color: fieldFormat.color,
                  textAlign: fieldFormat.alignment as any,
                }}>
                  {fieldName || '{{字段名}}'}
                </div>
              </div>
            </div>
          </Card>

          {/* 字段列表 */}
          <Card
            size="small"
            title={
              <Space>
                <span>已标记字段 ({fields.length})</span>
              </Space>
            }
            extra={
              fields.length > 0 && (
                <Button
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleClearAll}
                >
                  清空
                </Button>
              )
            }
          >
            <Table
              dataSource={fields}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无标记字段，请在文档中选择内容添加' }}
              style={{ marginBottom: 16 }}
            />

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="输入模板名称，如：员工信息表"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                disabled={savedTemplateId !== null}
                style={{ marginBottom: 8 }}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                block
                onClick={handleSaveTemplate}
                disabled={fields.length === 0 || !templateId || savedTemplateId !== null}
                loading={loading}
              >
                {savedTemplateId ? '模板已保存' : '保存模板'}
              </Button>
              <Button
                icon={<DownloadOutlined />}
                block
                onClick={handleDownloadCsv}
                disabled={fields.length === 0}
              >
                下载填充模板(CSV)
              </Button>
              <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
                保存模板后可直接在创建任务页面使用
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card size="small" style={{ marginTop: 24 }}>
        <Title level={5}>使用步骤</Title>
        <Row gutter={16}>
          <Col span={8}>
            <Text type="secondary">1. 上传Word文档</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">2. 选择模式：替换文本 或 插入单元格</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">3. 选中文本/点击单元格，输入字段名添加</Text>
          </Col>
        </Row>
      </Card>

      <style>{`
        .word-preview {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
        }
        .word-preview p {
          margin-bottom: 12px;
        }
        .word-preview table {
          border-collapse: collapse;
          width: 100%;
        }
        .word-preview td, .word-preview th {
          border: 1px solid #ddd;
          padding: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .word-preview td:hover {
          background-color: #f0f7ff;
        }
        .word-preview td.cell-selected {
          background-color: #1890ff !important;
          color: white;
        }
      `}</style>
    </div>
  );
}
