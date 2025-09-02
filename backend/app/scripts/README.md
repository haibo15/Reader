# 音频处理脚本

这个目录包含了用于音频文件处理的实用脚本。

## 脚本列表

### 1. cleanup_segmented_files.py
**功能**: 清理已经合并过的分段音频文件，节省存储空间

**用法**:
```bash
# 预览模式（不会实际删除文件）
python cleanup_segmented_files.py "../../audio/7a59aaff-5bb4-4b72-422f-850a-e9aacc73baaa"

# 实际删除模式
python cleanup_segmented_files.py "../../audio/7a59aaff-5bb4-4b72-422f-850a-e9aacc73baaa" --delete
```

**说明**: 此脚本会检查指定音频文件夹中的分段文件，如果对应的合并文件已存在，则可以安全删除分段文件。

### 2. generate_voice_previews.py
**功能**: 批量生成QWEN-TTS所有角色的预览音频文件

**用法**:
```bash
python generate_voice_previews.py
```

**说明**: 生成所有7个音色角色的预览音频，保存到 `../../audio/previews/` 目录。

### 3. merge_segmented_audio.py
**功能**: 合并分段音频文件为完整的章节文件

**用法**:
```bash
python merge_segmented_audio.py "../../audio/7a59aaff-5bb4-4b72-422f-850a-e9aacc73baaa"
```

**说明**: 将指定文件夹中的分段音频文件（如 `_part_1.wav`, `_part_2.wav` 等）合并为完整的章节文件。

### 4. run_voice_preview_generator.py
**功能**: 运行QWEN-TTS角色预览音频生成器的启动脚本

**用法**:
```bash
python run_voice_preview_generator.py
```

**说明**: 检查环境变量设置，然后调用 `generate_voice_previews.py` 生成预览音频。

## 注意事项

1. **路径引用**: 所有脚本中的路径引用已经更新为相对于 `backend/app/scripts` 目录的路径
2. **环境变量**: 运行语音生成脚本前，请确保在 `backend/.env` 文件中设置了 `DASHSCOPE_API_KEY`
3. **依赖**: 确保已安装所需的Python包（如 `dashscope`, `requests` 等）

## 目录结构

```
backend/
└── app/
    └── scripts/
        ├── cleanup_segmented_files.py
        ├── generate_voice_previews.py
        ├── merge_segmented_audio.py
        ├── run_voice_preview_generator.py
        └── README.md
```

## 使用建议

1. 先运行 `merge_segmented_audio.py` 合并分段文件
2. 确认合并成功后，运行 `cleanup_segmented_files.py` 清理分段文件
3. 需要生成新的角色预览时，运行 `run_voice_preview_generator.py`
