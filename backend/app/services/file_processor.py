import os
import re
from typing import List, Dict, Any
import PyPDF2
import pdfplumber
import ebooklib
from ebooklib import epub
from docx import Document

class FileProcessor:
    """文件处理服务，负责解析不同格式的文档文件"""
    
    def __init__(self):
        self.chapter_patterns = [
            r'^第[一二三四五六七八九十\d]+章\s*[^\n]*',
            r'^Chapter\s*\d+\s*[^\n]*',
            r'^第[一二三四五六七八九十\d]+节\s*[^\n]*',
            r'^Section\s*\d+\s*[^\n]*',
            r'^\d+\.\s*[^\n]*',
            r'^[一二三四五六七八九十\d]+、\s*[^\n]*'
        ]
    
    def extract_text(self, file_path: str, file_extension: str) -> str:
        """根据文件扩展名提取文本内容"""
        try:
            if file_extension == 'txt':
                return self._extract_txt(file_path)
            elif file_extension == 'pdf':
                return self._extract_pdf(file_path)
            elif file_extension == 'epub':
                return self._extract_epub(file_path)
            elif file_extension == 'docx':
                return self._extract_docx(file_path)
            else:
                raise ValueError(f"不支持的文件格式: {file_extension}")
        except Exception as e:
            raise Exception(f"文件解析失败: {str(e)}")
    
    def _extract_txt(self, file_path: str) -> str:
        """提取TXT文件内容"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # 尝试其他编码
            encodings = ['gbk', 'gb2312', 'latin-1']
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        return f.read()
                except UnicodeDecodeError:
                    continue
            raise Exception("无法识别文件编码")
    
    def _extract_pdf(self, file_path: str) -> str:
        """提取PDF文件内容"""
        text = ""
        try:
            # 首先尝试使用pdfplumber（更好的文本提取）
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            # 如果pdfplumber没有提取到内容，使用PyPDF2
            if not text.strip():
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n"
            
            return text
        except Exception as e:
            raise Exception(f"PDF解析失败: {str(e)}")
    
    def _extract_epub(self, file_path: str) -> str:
        """提取EPUB文件内容"""
        try:
            book = epub.read_epub(file_path)
            text = ""
            
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    content = item.get_content().decode('utf-8')
                    # 简单的HTML标签清理
                    content = re.sub(r'<[^>]+>', '', content)
                    text += content + "\n"
            
            return text
        except Exception as e:
            raise Exception(f"EPUB解析失败: {str(e)}")
    
    def _extract_docx(self, file_path: str) -> str:
        """提取DOCX文件内容"""
        try:
            doc = Document(file_path)
            text = ""
            
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text
        except Exception as e:
            raise Exception(f"DOCX解析失败: {str(e)}")
    
    def split_chapters(self, text: str) -> List[Dict[str, Any]]:
        """将文本分割成章节"""
        if not text.strip():
            return [{'title': '全文', 'content': text}]
        
        # 清理文本
        text = self._clean_text(text)
        
        # 查找章节标题
        chapter_positions = []
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            line = line.strip()
            if line:
                for pattern in self.chapter_patterns:
                    if re.match(pattern, line):
                        chapter_positions.append((i, line))
                        break
        
        # 如果没有找到章节标题，按段落分割
        if not chapter_positions:
            return self._split_by_paragraphs(text)
        
        # 按章节分割
        chapters = []
        for i, (pos, title) in enumerate(chapter_positions):
            start_pos = pos
            end_pos = chapter_positions[i + 1][0] if i + 1 < len(chapter_positions) else len(lines)
            
            chapter_content = '\n'.join(lines[start_pos:end_pos])
            chapters.append({
                'title': title,
                'content': chapter_content.strip()
            })
        
        # 如果第一个章节不是从开头开始，添加前面的内容
        if chapter_positions and chapter_positions[0][0] > 0:
            intro_content = '\n'.join(lines[:chapter_positions[0][0]])
            if intro_content.strip():
                chapters.insert(0, {
                    'title': '前言',
                    'content': intro_content.strip()
                })
        
        return chapters if chapters else [{'title': '全文', 'content': text}]
    
    def _clean_text(self, text: str) -> str:
        """清理文本内容"""
        # 移除多余的空白字符
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        
        # 移除特殊字符
        text = re.sub(r'[\r\t]', '', text)
        
        return text.strip()
    
    def _split_by_paragraphs(self, text: str, max_length: int = 2000) -> List[Dict[str, Any]]:
        """按段落分割文本"""
        paragraphs = text.split('\n\n')
        chapters = []
        current_chapter = ""
        chapter_count = 1
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            if len(current_chapter) + len(paragraph) > max_length and current_chapter:
                chapters.append({
                    'title': f'第{chapter_count}章',
                    'content': current_chapter.strip()
                })
                current_chapter = paragraph
                chapter_count += 1
            else:
                current_chapter += '\n\n' + paragraph if current_chapter else paragraph
        
        if current_chapter:
            chapters.append({
                'title': f'第{chapter_count}章',
                'content': current_chapter.strip()
            })
        
        return chapters
