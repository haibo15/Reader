#!/usr/bin/env python3
"""
分段音频文件合并脚本
用于处理已经生成的分段音频文件，将它们合并成完整的章节文件
"""

import os
import wave
import sys
from pathlib import Path

def merge_segmented_files(audio_folder: str):
    """合并指定文件夹中的分段音频文件"""
    try:
        print(f"正在处理文件夹: {audio_folder}")
        
        if not os.path.exists(audio_folder):
            print(f"错误: 文件夹不存在: {audio_folder}")
            return
        
        # 查找所有分段文件
        segmented_groups = {}
        
        for filename in os.listdir(audio_folder):
            if filename.endswith('.wav') and '_part_' in filename:
                # 解析分段文件名，例如：chapter_57__Serena__20250902_120136.wav_part_1.wav
                base_name = filename.replace('.wav', '')  # 移除.wav后缀
                if '_part_' in base_name:
                    # 分割基础名称和部分编号
                    parts = base_name.split('_part_')
                    if len(parts) == 2:
                        base_chapter_name = parts[0]  # chapter_57__Serena__20250902_120136
                        part_num = int(parts[1])      # 1, 2, 3, 4...
                        
                        if base_chapter_name not in segmented_groups:
                            segmented_groups[base_chapter_name] = {}
                        
                        segmented_groups[base_chapter_name][part_num] = filename
        
        if not segmented_groups:
            print("没有找到分段文件")
            return
        
        print(f"找到 {len(segmented_groups)} 个分段组:")
        for base_name, parts in segmented_groups.items():
            print(f"  {base_name}: {len(parts)} 个部分")
        
        # 处理每个分段组
        success_count = 0
        for base_name, parts in segmented_groups.items():
            if len(parts) > 1:  # 至少需要2个部分才需要合并
                # 按部分编号排序
                sorted_parts = sorted(parts.items())
                
                # 检查是否所有部分都存在
                expected_parts = list(range(1, len(parts) + 1))
                actual_parts = [p[0] for p in sorted_parts]
                
                if actual_parts == expected_parts:
                    # 所有部分都存在，可以合并
                    if merge_chapter_segments(audio_folder, base_name, sorted_parts):
                        success_count += 1
                else:
                    print(f"警告: {base_name} 缺少部分，期望 {expected_parts}，实际 {actual_parts}")
        
        print(f"\n合并完成！成功合并 {success_count} 个章节")
        
    except Exception as e:
        print(f"处理分段文件时出错: {str(e)}")

def merge_chapter_segments(audio_folder: str, base_name: str, sorted_parts: list):
    """合并单个章节的分段文件"""
    try:
        # 生成合并后的文件名
        merged_filename = f"{base_name}.wav"
        merged_filepath = os.path.join(audio_folder, merged_filename)
        
        # 如果合并文件已存在，跳过
        if os.path.exists(merged_filepath):
            print(f"跳过 {base_name}: 合并文件已存在")
            return True
        
        print(f"正在合并分段文件: {base_name}")
        
        # 使用wave模块合并WAV文件
        with wave.open(merged_filepath, 'wb') as output_wav:
            # 读取第一个分段文件获取参数
            first_part_path = os.path.join(audio_folder, sorted_parts[0][1])
            with wave.open(first_part_path, 'rb') as first_wav:
                channels = first_wav.getnchannels()
                sample_width = first_wav.getsampwidth()
                frame_rate = first_wav.getframerate()
                comp_type = first_wav.getcomptype()
                comp_name = first_wav.getcompname()
            
            # 设置输出文件参数
            output_wav.setnchannels(channels)
            output_wav.setsampwidth(sample_width)
            output_wav.setframerate(frame_rate)
            output_wav.setcomptype(comp_type, comp_name)
            
            # 依次读取并写入每个分段
            total_frames = 0
            for part_num, part_filename in sorted_parts:
                part_filepath = os.path.join(audio_folder, part_filename)
                with wave.open(part_filepath, 'rb') as input_wav:
                    # 验证音频参数是否一致
                    if (input_wav.getnchannels() != channels or 
                        input_wav.getsampwidth() != sample_width or 
                        input_wav.getframerate() != frame_rate or 
                        input_wav.getcomptype() != comp_type):
                        print(f"警告: 分段文件 {part_filename} 的音频参数不一致，跳过合并")
                        return False
                    
                    # 读取音频数据并写入输出文件
                    frames = input_wav.getnframes()
                    audio_data = input_wav.readframes(frames)
                    output_wav.writeframes(audio_data)
                    total_frames += frames
                    
                    print(f"  已添加部分 {part_num}: {frames} 帧")
            
            # 验证输出文件
            with wave.open(merged_filepath, 'rb') as check_wav:
                actual_frames = check_wav.getnframes()
                if actual_frames != total_frames:
                    print(f"警告: 合并后帧数不匹配，期望 {total_frames}，实际 {actual_frames}")
                else:
                    print(f"  合并成功: {actual_frames} 帧")
        
        print(f"成功合并分段文件为: {merged_filename}")
        return True
        
    except Exception as e:
        print(f"合并分段文件失败 {base_name}: {str(e)}")
        # 如果合并失败，删除可能创建的不完整文件
        if os.path.exists(merged_filepath):
            try:
                os.remove(merged_filepath)
            except:
                pass
        return False

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python merge_segmented_audio.py <音频文件夹路径>")
        print("示例: python merge_segmented_audio.py ./audio/7a59aaff-5bb4-4c43-98af-c3614baf4b5e")
        return
    
    audio_folder = sys.argv[1]
    
    if not os.path.exists(audio_folder):
        print(f"错误: 文件夹不存在: {audio_folder}")
        return
    
    print("分段音频文件合并工具")
    print("=" * 50)
    
    merge_segmented_files(audio_folder)
    
    print("\n处理完成！")

if __name__ == "__main__":
    main()
