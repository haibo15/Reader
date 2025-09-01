#!/usr/bin/env python3
"""
简易 WAV 元数据检查脚本
用法：python inspect_wav.py <wav目录或具体文件路径>
输出：每个文件的 channels / sampwidth / framerate / nframes / comptype / compname
"""

import os
import sys
import json
import glob
import contextlib
import wave


def inspect_wav_file(filepath: str):
    result = {"file": filepath}
    try:
        with contextlib.closing(wave.open(filepath, "rb")) as w:
            result.update(
                {
                    "channels": w.getnchannels(),
                    "sampwidth": w.getsampwidth(),
                    "framerate": w.getframerate(),
                    "nframes": w.getnframes(),
                    "comptype": w.getcomptype(),
                    "compname": w.getcompname(),
                    "duration_sec": round(w.getnframes() / float(w.getframerate() or 1), 3),
                }
            )
    except Exception as e:
        result["error"] = str(e)
    return result


def main():
    if len(sys.argv) < 2:
        print("{}".format(json.dumps({"error": "missing path"}, ensure_ascii=False)))
        sys.exit(1)

    target_path = sys.argv[1]
    files = []
    if os.path.isdir(target_path):
        files = sorted(glob.glob(os.path.join(target_path, "*.wav")))
    elif os.path.isfile(target_path) and target_path.lower().endswith(".wav"):
        files = [target_path]
    else:
        print("{}".format(json.dumps({"error": "invalid path or no wav"}, ensure_ascii=False)))
        sys.exit(1)

    results = [inspect_wav_file(f) for f in files]
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()


