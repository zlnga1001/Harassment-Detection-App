import cv2
import numpy as np
from ultralytics import YOLO
from pathlib import Path
import torch
import json
from collections import defaultdict

def calculate_center(box):
    """Calculate center point of a bounding box"""
    x1, y1, x2, y2 = box
    return (int((x1 + x2) / 2), int((y1 + y2) / 2))

def calculate_iou(box1, box2):
    """Calculate IoU between two boxes"""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    
    intersection = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    
    return intersection / float(area1 + area2 - intersection)

def process_video(video_path, output_path, json_path, frame_interval=5):
    """
    Process video to detect people and save bounding boxes data with tracking.
    Args:
        video_path: Path to input video
        output_path: Path to save output video
        json_path: Path to save bounding boxes data
        frame_interval: Process every Nth frame
    """
    # Load the YOLOv8 model
    model = YOLO("yolov8s.pt")

    # Open the video
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Error opening video file: {video_path}")

    # Get video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Initialize video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    frame_count = 0
    next_track_id = 0
    tracked_objects = {}  # {track_id: {"boxes": [], "centers": [], "last_frame": frame_count}}
    boxes_data = {
        "video_info": {
            "name": video_path.name,
            "width": width,
            "height": height,
            "fps": fps,
            "total_frames": total_frames,
            "frame_interval": frame_interval
        },
        "frames": {},
        "tracks": defaultdict(list)  # Track history for each ID
    }

    print(f"Processing video: {video_path.name}")
    print(f"Total frames: {total_frames}")

    # Color map for tracking visualization
    color_map = {}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        current_boxes = []
        current_confidences = []
        current_track_ids = []

        if frame_count % frame_interval == 0:
            # Detect people
            results = model.predict(
                frame,
                classes=[0],  # class 0 is person
                conf=0.2,     # Lower confidence threshold
                iou=0.2,      # Lower IoU threshold
                verbose=False
            )
            
            # Process detections
            for r in results:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    x1, y1 = max(0, int(x1)), max(0, int(y1))
                    x2, y2 = min(width, int(x2)), min(height, int(y2))
                    current_box = [x1, y1, x2, y2]
                    
                    # Try to match with existing tracks
                    best_iou = 0
                    best_track_id = None
                    
                    for track_id, track_info in tracked_objects.items():
                        if track_info["last_frame"] >= frame_count - frame_interval * 2:  # Only consider recent tracks
                            iou = calculate_iou(current_box, track_info["boxes"][-1])
                            if iou > 0.3 and iou > best_iou:  # IOU threshold
                                best_iou = iou
                                best_track_id = track_id
                    
                    # Assign track ID
                    if best_track_id is None:
                        best_track_id = next_track_id
                        next_track_id += 1
                        tracked_objects[best_track_id] = {
                            "boxes": [],
                            "centers": [],
                            "last_frame": frame_count
                        }
                        # Assign random color for new track
                        color_map[best_track_id] = tuple(np.random.randint(0, 255, 3).tolist())
                    
                    # Update track info
                    tracked_objects[best_track_id]["boxes"].append(current_box)
                    tracked_objects[best_track_id]["centers"].append(calculate_center(current_box))
                    tracked_objects[best_track_id]["last_frame"] = frame_count
                    
                    current_boxes.append(current_box)
                    current_confidences.append(float(box.conf))
                    current_track_ids.append(best_track_id)

        # Store frame data
        boxes_data["frames"][str(frame_count)] = {
            "boxes": current_boxes,
            "confidences": current_confidences,
            "track_ids": current_track_ids,
            "is_keyframe": frame_count % frame_interval == 0
        }

        # Update tracks data
        for track_id, track_info in tracked_objects.items():
            if track_info["last_frame"] == frame_count:
                boxes_data["tracks"][str(track_id)].append({
                    "frame": frame_count,
                    "box": track_info["boxes"][-1],
                    "center": track_info["centers"][-1]
                })

        # Visualization
        if current_boxes:
            # Draw movement paths
            for track_id, track_info in tracked_objects.items():
                if len(track_info["centers"]) > 1:
                    color = color_map[track_id]
                    # Draw last N points of the path
                    path_points = np.array(track_info["centers"][-20:], np.int32)
                    cv2.polylines(frame, [path_points], False, color, 2)

            # Draw current boxes and IDs
            for box, conf, track_id in zip(current_boxes, current_confidences, current_track_ids):
                x1, y1, x2, y2 = box
                color = color_map[track_id]
                
                # Draw semi-transparent box
                overlay = frame.copy()
                cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
                cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                # Draw ID and confidence
                label = f"ID:{track_id} {conf:.2f}"
                cv2.putText(frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Write frame
        out.write(frame)
        
        frame_count += 1
        if frame_count % 100 == 0:
            print(f"Processed {frame_count}/{total_frames} frames")

    # Release everything
    cap.release()
    out.release()

    # Save JSON data
    with open(json_path, 'w') as f:
        json.dump(boxes_data, f, indent=2)
    print(f"Bounding boxes data saved to: {json_path}")
    print(f"Video with bounding boxes saved to: {output_path}")

def main():
    # Process all videos
    videos_dir = Path(__file__).parent.parent / "public/videos"
    json_dir = Path(__file__).parent.parent / "public"
    output_dir = videos_dir / "output"
    output_dir.mkdir(exist_ok=True)
    
    video_files = sorted(videos_dir.glob("*.mp4"))
    
    if not video_files:
        print("No video files found")
        return
        
    for video_path in video_files:
        # Skip videos that already have boxes
        if video_path.stem.endswith('_boxes'):
            continue
            
        print(f"\nProcessing video: {video_path.name}")
        output_path = output_dir / f"{video_path.stem}_boxes.mp4"
        json_path = json_dir / f"{video_path.stem}_boxes.json"
        process_video(video_path, output_path, json_path)

if __name__ == "__main__":
    main()
