#!/usr/bin/env python3
"""
清理分段音频文件脚本
删除已经合并过的分段文件，节省存储空间
"""

import os
import sys
from pathlib import Path

def cleanup_segmented_files(audio_folder: str, dry_run: bool = True):
    """清理分段音频文件"""
    try:
        print(f"正在处理文件夹: {audio_folder}")
        if dry_run:
            print("⚠️  这是预览模式，不会实际删除文件")
        else:
            print("🗑️  这是实际删除模式，将删除分段文件")
        print()
        
        if not os.path.exists(audio_folder):
            print(f"错误: 文件夹不存在: {audio_folder}")
            return
        
        # 查找所有分段文件
        segmented_groups = {}
        files_to_delete = []
        
        for filename in os.listdir(audio_folder):
            if filename.endswith('.wav') and '_part_' in filename:
                # 解析分段文件名
                base_name = filename.replace('.wav', '')
                if '_part_' in base_name:
                    parts = base_name.split('_part_')
                    if len(parts) == 2:
                        base_chapter_name = parts[0]
                        part_num = int(parts[1])
                        
                        if base_chapter_name not in segmented_groups:
                            segmented_groups[base_chapter_name] = {}
                        
                        segmented_groups[base_chapter_name][part_num] = filename
        
        if not segmented_groups:
            print("没有找到分段文件")
            return
        
        print(f"找到 {len(segmented_groups)} 个分段组:")
        
        # 检查每个分段组
        for base_name, parts in segmented_groups.items():
            # 检查合并后的文件是否存在
            merged_filename = f"{base_name}.wav"
            merged_filepath = os.path.join(audio_folder, merged_filename)
            
            if os.path.exists(merged_filepath):
                # 合并文件存在，可以删除分段文件
                print(f"✅ {base_name}: {len(parts)} 个部分 -> 合并文件已存在")
                
                # 收集要删除的文件
                for part_num, part_filename in parts.items():
                    part_filepath = os.path.join(audio_folder, part_filename)
                    file_size = os.path.getsize(part_filepath) / (1024 * 1024)  # MB
                    files_to_delete.append({
                        'filepath': part_filepath,
                        'filename': part_filename,
                        'size_mb': file_size
                    })
            else:
                print(f"❌ {base_name}: {len(parts)} 个部分 -> 合并文件不存在，保留分段文件")
        
        if not files_to_delete:
            print("\n没有需要清理的分段文件")
            return
        
        # 显示将要删除的文件
        print(f"\n将要删除 {len(files_to_delete)} 个分段文件:")
        total_size = 0
        for file_info in files_to_delete:
            print(f"  {file_info['filename']} ({file_info['size_mb']:.1f} MB)")
            total_size += file_info['size_mb']
        
        print(f"\n总计可节省空间: {total_size:.1f} MB")
        
        if not dry_run:
            # 实际删除文件
            print("\n开始删除文件...")
            deleted_count = 0
            for file_info in files_to_delete:
                try:
                    os.remove(file_info['filepath'])
                    print(f"  已删除: {file_info['filename']}")
                    deleted_count += 1
                except Exception as e:
                    print(f"  删除失败 {file_info['filename']}: {str(e)}")
            
            print(f"\n删除完成！成功删除 {deleted_count} 个文件，节省 {total_size:.1f} MB 空间")
        else:
            print(f"\n要实际删除文件，请运行: python {sys.argv[0]} \"{audio_folder}\" --delete")
        
    except Exception as e:
        print(f"处理分段文件时出错: {str(e)}")

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python cleanup_segmented_files.py <音频文件夹路径> [--delete]")
        print("示例: python cleanup_segmented_files.py ../../audio/b9bd7a2e-4b72-422f-850a-e9aacc73baaa")
        print("添加 --delete 参数来实际删除文件")
        return
    
    audio_folder = sys.argv[1]
    dry_run = '--delete' not in sys.argv
    
    if not os.path.exists(audio_folder):
        print(f"错误: 文件夹不存在: {audio_folder}")
        return
    
    print("分段音频文件清理工具")
    print("=" * 50)
    
    cleanup_segmented_files(audio_folder, dry_run)
    
    print("\n处理完成！")

if __name__ == "__main__":
    main()
