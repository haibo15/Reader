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
        print(f"🔍 开始提取TXT文件: {file_path}")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
                print(f"✅ TXT文件提取成功，长度: {len(text)} 字符")
                return text
        except UnicodeDecodeError:
            print("🔄 UTF-8编码失败，尝试其他编码...")
            # 尝试其他编码
            encodings = ['gbk', 'gb2312', 'latin-1']
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        text = f.read()
                        print(f"✅ TXT文件提取成功 (编码: {encoding})，长度: {len(text)} 字符")
                        return text
                except UnicodeDecodeError:
                    print(f"⚠️ 编码 {encoding} 失败")
                    continue
            print("❌ 所有编码尝试失败")
            raise Exception("无法识别文件编码")
    
    def _extract_pdf(self, file_path: str) -> str:
        """提取PDF文件内容"""
        text = ""
        print(f"🔍 开始提取PDF文件: {file_path}")
        
        try:
            # 首先尝试使用pdfplumber（更好的文本提取）
            print("🔄 尝试使用pdfplumber提取文本...")
            with pdfplumber.open(file_path) as pdf:
                print(f"📄 PDF页数: {len(pdf.pages)}")
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                        print(f"✅ 第 {i+1} 页提取成功，长度: {len(page_text)} 字符")
                    else:
                        print(f"⚠️ 第 {i+1} 页提取为空")
            
            # 如果pdfplumber没有提取到内容，使用PyPDF2
            if not text.strip():
                print("🔄 pdfplumber提取失败，尝试使用PyPDF2...")
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    print(f"📄 PyPDF2检测到页数: {len(pdf_reader.pages)}")
                    for i, page in enumerate(pdf_reader.pages):
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                            print(f"✅ 第 {i+1} 页提取成功，长度: {len(page_text)} 字符")
                        else:
                            print(f"⚠️ 第 {i+1} 页提取为空")
            
            print(f"📊 最终提取的文本总长度: {len(text)} 字符")
            
            if not text.strip():
                print("❌ 警告：PDF文本提取结果为空！")
                print("可能的原因：")
                print("1. PDF是扫描版，没有文本层")
                print("2. PDF是图片格式")
                print("3. PDF文件损坏")
                print("4. PDF有密码保护")
            else:
                print("✅ PDF文本提取成功")
            
            return text
        except Exception as e:
            print(f"❌ PDF解析失败: {str(e)}")
            raise Exception(f"PDF解析失败: {str(e)}")
    
    def _extract_epub(self, file_path: str) -> str:
        """提取EPUB文件内容"""
        print(f"🔍 开始提取EPUB文件: {file_path}")
        try:
            book = epub.read_epub(file_path)
            text = ""
            
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    content = item.get_content().decode('utf-8')
                    # 简单的HTML标签清理
                    content = re.sub(r'<[^>]+>', '', content)
                    text += content + "\n"
            
            print(f"✅ EPUB文件提取成功，长度: {len(text)} 字符")
            return text
        except Exception as e:
            print(f"❌ EPUB解析失败: {str(e)}")
            raise Exception(f"EPUB解析失败: {str(e)}")
    
    def _extract_docx(self, file_path: str) -> str:
        """提取DOCX文件内容"""
        print(f"🔍 开始提取DOCX文件: {file_path}")
        try:
            doc = Document(file_path)
            text = ""
            
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            print(f"✅ DOCX文件提取成功，长度: {len(text)} 字符")
            return text
        except Exception as e:
            print(f"❌ DOCX解析失败: {str(e)}")
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
