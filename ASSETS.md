# 音乐与图像来源

## 音乐

三个试听片段《把黄昏留给你》《雨停之前》《慢慢走回家》是为本原型编写的合成器编排，由 `lib/sound.ts` 在浏览器生成，长度均为 48 秒。未接入 QQ 音乐或其他商业音乐库，未使用外部录音。

界面中的「轻柔钢琴」「玻璃琴音」「温暖拨弦」描述合成音色的设计方向；并非真人演奏或真实乐器采样。

## 明信片封面

- 文件：`public/coastal-dusk.png`
- 尺寸：1536 × 1024
- 来源：内置 ImageGen 工具，单次生成。不是实拍地点记录。
- 使用位置：明信片主图、音乐缩略图；不同色彩主题用同一图像的颜色处理表达心情。
- 工作区原图：`C:/Users/26735/Documents/Codex/2026-09-17/n/work/moment-art/coastal-dusk.png`

完整提示词：

```text
Use case: photorealistic-natural
Asset type: Landscape photographic cover for a music postcard product, usable as a large cover and a small thumbnail.
Primary request: A quiet coastal road at dusk, with the blue sea in the distance and the setting sun glittering softly across the water. A few restrained roadside utility poles or a low guardrail evoke a peaceful coastal journey.
Style/medium: Refined, believable analog film photography; cinematic realism, subtle soft grain, gentle halation, natural textures.
Composition/framing: Horizontal landscape, approximately 1536x1024, 3:2 aspect ratio. Place the sea horizon at the upper third. Compose the road and calm sea with broad, uncluttered mid and lower areas that can receive interface text later. The image itself must remain a complete natural photograph.
Lighting/mood: Warm twilight, spacious, still, nostalgic and quietly emotional.
Color palette: Soft warm apricot-orange sky, deep teal-blue water, subdued road tones.
Constraints: No close-up people. No text or letters, no frame, no border, no UI, no collage, no watermark. No anime, illustration, SVG, or 3D rendering. Generate exactly one image.
```

图标使用项目已有的 Lucide 图标库；界面组件复用项目自带的 Shadcn/Radix 组件。
