"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Maximize01, Play, VolumeMax, VolumeX } from "@untitled-ui/icons-react";
import { LoadingIndicator } from "../loading-indicator";
import { Button } from "../button";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    tracks?: {
        src: string;
        kind: "subtitles" | "captions";
        srclang: string;
        label: string;
    }[];
    onError?: (error: Error) => void;
}

// Fonction throttle optimisée
function throttle<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastRan: number | null = null;

    const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        lastArgs = args;
        const now = Date.now();

        // Si c'est le premier appel ou si le délai est écoulé
        if (!lastRan || now - lastRan >= delay) {
            func.call(this, ...args);
            lastRan = now;
            lastArgs = null;
        } else if (!timeoutId) {
            // Programmer un appel pour la fin du délai avec les derniers args
            const remaining = delay - (now - lastRan);
            timeoutId = setTimeout(() => {
                if (lastArgs) {
                    func.call(this, ...lastArgs);
                    lastRan = Date.now();
                }
                timeoutId = null;
                lastArgs = null;
            }, remaining);
        }
    } as T;

    (throttled as T & { cancel: () => void }).cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
        lastRan = null;
    };

    return throttled as T & { cancel: () => void };
}

export function VideoPlayer({
    src,
    poster,
    size = "md",
    className,
    tracks = [],
    onError,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const thumbnailCache = useRef<Map<number, string>>(new Map());
    const lastSeekTimestamp = useRef<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("videoPlayerVolume");
            return saved ? parseFloat(saved) : 0.75;
        }
        return 0.75;
    });
    const [buffered, setBuffered] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isHovering, setIsHovering] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showRateMenu, setShowRateMenu] = useState(false);
    const [showCaptionsMenu, setShowCaptionsMenu] = useState(false);
    const [activeCaptionTrack, setActiveCaptionTrack] = useState<number>(-1);
    const [previewTime, setPreviewTime] = useState<number | null>(null);
    const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

    // Constantes
    const sizeClasses = {
        sm: "w-full max-w-[320px]",
        md: "w-full max-w-[560px]",
        lg: "w-full max-w-[720px]",
    };
    const paddingClasses = {
        sm: "px-1 pt-6 pb-1",
        md: "px-5 pt-10 pb-4",
        lg: "px-8 pt-12 pb-6",
    };
    const radiusClasses = {
        sm: "rounded-md",
        md: "rounded-md",
        lg: "rounded-lg",
    };
    const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const SEEK_THRESHOLD = 0.3;
    const MAX_THUMBNAIL_WIDTH = size === "sm" ? 100 : 160;
    const MAX_CACHE_SIZE = 50;

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video || hasError) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play().catch(e => console.error("Play error:", e));
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying, hasError]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    // Save volume preference
    useEffect(() => {
        localStorage.setItem("videoPlayerVolume", volume.toString());
    }, [volume]);

    // Event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const updateBuffered = () => {
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }
        };
        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleError = () => {
            setHasError(true);
            setIsLoading(false);
            if (onError) {
                onError(new Error("Failed to load video"));
            }
        };

        video.addEventListener("timeupdate", updateTime);
        video.addEventListener("loadedmetadata", updateDuration);
        video.addEventListener("progress", updateBuffered);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("error", handleError);

        return () => {
            video.removeEventListener("timeupdate", updateTime);
            video.removeEventListener("loadedmetadata", updateDuration);
            video.removeEventListener("progress", updateBuffered);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("error", handleError);
        };
    }, [onError]);

    // Volume and playback rate
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.volume = isMuted ? 0 : volume;
        video.playbackRate = playbackRate;
    }, [volume, isMuted, playbackRate]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const video = videoRef.current;
            if (!video || hasError) return;

            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case " ":
                case "k":
                    e.preventDefault();
                    togglePlay();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    video.currentTime = Math.min(duration, video.currentTime + 5);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setVolume(prev => Math.min(1, prev + 0.1));
                    setIsMuted(false);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    setVolume(prev => Math.max(0, prev - 0.1));
                    break;
                case "m":
                    e.preventDefault();
                    toggleMute();
                    break;
                case "f":
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    e.preventDefault();
                    video.currentTime = (parseInt(e.key) / 10) * duration;
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [duration, hasError, toggleMute, togglePlay]);

    // Cleanup
    useEffect(() => {
        // Capture the current cache reference so the cleanup doesn't read a changed ref
        const cache = thumbnailCache.current;

        return () => {
            // Nettoyer le cache de miniatures
            cache.forEach(url => {
                if (url.startsWith("blob:")) {
                    URL.revokeObjectURL(url);
                }
            });
            cache.clear();
        };
    }, []);

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const togglePictureInPicture = async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch (error) {
            console.error("PiP error:", error);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        const progressBar = e.currentTarget;
        if (!video || !progressBar || hasError) return;

        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * duration;
    };

    const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
        const volumeBar = e.currentTarget;
        const rect = volumeBar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(pos);
        if (pos === 0) {
            setIsMuted(true);
        } else {
            setIsMuted(false);
        }
    };

    // Génération optimisée de miniature avec cache
    const generateThumbnail = useCallback(
        async (time: number) => {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (!video || !canvas || video.readyState < 2) {
                return;
            }

            // Vérifier le cache (arrondir à la seconde)
            const cacheKey = Math.floor(time);
            if (thumbnailCache.current.has(cacheKey)) {
                setPreviewThumbnail(thumbnailCache.current.get(cacheKey)!);
                setIsGeneratingPreview(false);
                return;
            }

            // Vérifier si on a déjà seek récemment à ce moment
            const timeSinceLastSeek = Date.now() - lastSeekTimestamp.current;
            if (Math.abs(time - video.currentTime) < SEEK_THRESHOLD && timeSinceLastSeek < 200) {
                return;
            }

            setIsGeneratingPreview(true);
            const originalTime = video.currentTime;
            const wasPlaying = !video.paused;

            try {
                video.currentTime = time;
                lastSeekTimestamp.current = Date.now();

                await new Promise<void>(resolve => {
                    const handleSeeked = () => {
                        video.removeEventListener("seeked", handleSeeked);

                        requestAnimationFrame(() => {
                            // Optimiser la taille du canvas
                            const scale = MAX_THUMBNAIL_WIDTH / video.videoWidth;
                            canvas.width = MAX_THUMBNAIL_WIDTH;
                            canvas.height = video.videoHeight * scale;

                            const ctx = canvas.getContext("2d", { willReadFrequently: true });
                            if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

                                // Gérer la taille du cache
                                if (thumbnailCache.current.size >= MAX_CACHE_SIZE) {
                                    const iteratorResult = thumbnailCache.current.keys().next();
                                    const firstKey = iteratorResult.value;
                                    if (firstKey !== undefined) {
                                        const oldUrl = thumbnailCache.current.get(firstKey);
                                        if (oldUrl?.startsWith("blob:")) {
                                            URL.revokeObjectURL(oldUrl);
                                        }
                                        thumbnailCache.current.delete(firstKey);
                                    }
                                }

                                thumbnailCache.current.set(cacheKey, dataUrl);
                                setPreviewThumbnail(dataUrl);
                            }
                            setIsGeneratingPreview(false);
                            resolve();
                        });
                    };
                    video.addEventListener("seeked", handleSeeked);
                });

                // Restaurer la position originale si on était en lecture
                if (wasPlaying && isPlaying) {
                    video.currentTime = originalTime;
                }
            } catch (error) {
                console.error("Error generating thumbnail:", error);
                setIsGeneratingPreview(false);
            }
        },
        [isPlaying, MAX_THUMBNAIL_WIDTH]
    );

    // Version throttled de la génération de miniature
    const throttledGenerateThumbnail = useMemo(() => {
        return throttle(
            ((time: number) => {
                generateThumbnail(time);
            }) as (...args: unknown[]) => void,
            200
        );
    }, [generateThumbnail]);

    // Cleanup du throttle
    useEffect(() => {
        return () => {
            const fn = throttledGenerateThumbnail as unknown as { cancel?: () => void };
            if (typeof fn.cancel === "function") {
                fn.cancel();
            }
        };
    }, [throttledGenerateThumbnail]);

    const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
        const progressBar = e.currentTarget;
        const video = videoRef.current;
        if (!video || !progressBar || duration === 0 || hasError) {
            setPreviewTime(null);
            setPreviewThumbnail(null);
            return;
        }

        const rect = progressBar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = pos * duration;

        setPreviewTime(time);
        throttledGenerateThumbnail(time);
    };

    const handleProgressLeave = () => {
        setPreviewTime(null);
        setPreviewThumbnail(null);
        setIsGeneratingPreview(false);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        setIsHovering(true);

        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
        }

        if (isPlaying) {
            hideControlsTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (isPlaying) {
            setShowControls(false);
        }
    };

    const handleDoubleClick = () => {
        toggleFullscreen();
    };

    const handleCaptionToggle = (index: number) => {
        const video = videoRef.current;
        if (!video) return;

        const textTracks = video.textTracks;

        for (let i = 0; i < textTracks.length; i++) {
            textTracks[i].mode = "hidden";
        }

        if (index >= 0 && index < textTracks.length) {
            textTracks[index].mode = "showing";
            setActiveCaptionTrack(index);
        } else {
            setActiveCaptionTrack(-1);
        }

        setShowCaptionsMenu(false);
    };

    const formatTime = (time: number | null) => {
        if (time === null || isNaN(time) || time < 0) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    // Calculer la position de la prévisualisation avec limites
    const getPreviewStyle = () => {
        if (previewTime === null || duration === 0) return {};

        const rawPosition = (previewTime / duration) * 100;
        // Limiter entre 10% et 90% pour éviter de sortir de l'écran
        const clampedPosition = Math.max(10, Math.min(90, rawPosition));

        return {
            left: `${clampedPosition}%`,
            transform: "translateX(-50%)",
        };
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;
    const volumeProgress = isMuted ? 0 : volume * 100;
    const isControlDisabled = hasError;

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative aspect-video overflow-hidden bg-black ring-[0.5px] ring-alpha-white/30",
                sizeClasses[size],
                radiusClasses[size],
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            role="region"
            aria-label="Video player"
        >
            {/* Canvas caché pour capture de miniatures */}
            <canvas ref={canvasRef} className="absolute inset-0 z-[-1] hidden" aria-hidden="true" />

            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="size-full object-cover"
                onClick={togglePlay}
                onDoubleClick={handleDoubleClick}
                crossOrigin="anonymous"
                playsInline
            >
                {tracks.map((track, index) => (
                    <track
                        key={index}
                        src={track.src}
                        kind={track.kind}
                        srcLang={track.srclang}
                        label={track.label}
                    />
                ))}
            </video>

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center text-white">
                        <p className="text-lg font-semibold mb-2">Error loading video</p>
                        <p className="text-sm text-gray-300">Please try again later</p>
                    </div>
                </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <LoadingIndicator size="lg" />
                </div>
            )}

            {/* Play Overlay */}
            {(!isPlaying || isHovering) && !hasError && (
                <div
                    className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity duration-300",
                        !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={togglePlay}
                >
                    {!isPlaying && (
                        <Button
                            onClick={togglePlay}
                            variant="primary"
                            size="xl"
                            isDisabled={isLoading || isControlDisabled}
                            className="w-16 h-16 rounded-full bg-alpha-white/30 backdrop-blur-md hover:bg-white/40 transition-colors !p-0"
                            aria-label="Play video"
                            leftIcon={<Play className="w-5 h-5 text-white fill-white ml-1" />}
                        />
                    )}
                </div>
            )}

            {/* Controls Bar */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 flex flex-col transition-all duration-300 z-10",
                    "bg-gradient-to-t from-black/60 to-transparent",
                    paddingClasses[size],
                    showControls || !isPlaying
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4 pointer-events-none"
                )}
            >
                {/* Aperçu de la miniature au survol */}
                {previewTime !== null && (
                    <div
                        className="absolute bottom-full mb-3 p-2 bg-black/90 rounded-lg shadow-xl pointer-events-none transition-opacity duration-150 border border-white/10"
                        style={{
                            ...getPreviewStyle(),
                            minWidth: size === "sm" ? 100 : 160,
                            maxWidth: size === "sm" ? 100 : 160,
                        }}
                    >
                        <div
                            className="relative w-full bg-gray-800 rounded-md overflow-hidden"
                            style={{
                                height: size === "sm" ? 60 : 90,
                            }}
                        >
                            {isGeneratingPreview ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <LoadingIndicator size="sm" />
                                </div>
                            ) : previewThumbnail ? (
                                <img
                                    src={previewThumbnail}
                                    alt={`Video preview at ${formatTime(previewTime)}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                                    Loading...
                                </div>
                            )}
                        </div>
                        <p className="text-white text-xs text-center mt-1 font-mono">
                            {formatTime(previewTime)}
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-1 w-full">
                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlay}
                        className="p-2 hover:bg-alpha-white/20 hover:backdrop-blur-sm rounded-sm transition-colors text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M4 1C5.10457 1 6 1.89543 6 3V13C6 14.1046 5.10457 15 4 15C2.89543 15 2 14.1046 2 13V3C2 1.89543 2.89543 1 4 1ZM12 1C13.1046 1 14 1.89543 14 3V13C14 14.1046 13.1046 15 12 15C10.8954 15 10 14.1046 10 13V3C10 1.89543 10.8954 1 12 1Z"
                                    fill="white"
                                />
                            </svg>
                        ) : (
                            <Play className="size-4 fill-white" aria-hidden="true" />
                        )}
                    </button>

                    {/* Volume Control */}
                    {size !== "sm" && (
                        <div className="flex items-center gap-0 h-8 pr-2">
                            <button
                                onClick={toggleMute}
                                aria-label={isMuted ? "Unmute" : "Mute"}
                                disabled={isControlDisabled}
                                className="w-8 h-full p-2 cursor-pointer text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded-sm"
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="size-4 fill-white" aria-hidden="true" />
                                ) : (
                                    <VolumeMax className="size-4 fill-white" aria-hidden="true" />
                                )}
                            </button>
                            <div
                                className={cn(
                                    "relative h-1 w-12 rounded-full bg-alpha-white/30 cursor-pointer",
                                    isControlDisabled &&
                                        "opacity-50 cursor-not-allowed pointer-events-none"
                                )}
                                onClick={handleVolumeChange}
                                role="slider"
                                aria-label="Volume"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(volumeProgress)}
                                tabIndex={0}
                            >
                                <div
                                    className="absolute left-0 top-0 h-full rounded-full bg-fg-white flex items-center justify-end pr-3"
                                    style={{ width: `${volumeProgress}%` }}
                                >
                                    <div className="size-3 rounded-full bg-fg-white -mr-3" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    <div className="flex-1 flex items-center gap-2 px-2">
                        <span className="text-white text-xs font-semibold min-w-[36px]">
                            {formatTime(currentTime)}
                        </span>
                        <div
                            className={cn(
                                "relative flex-1 h-2 rounded-full bg-alpha-white/30 backdrop-blur-sm cursor-pointer",
                                isControlDisabled &&
                                    "opacity-50 cursor-not-allowed pointer-events-none"
                            )}
                            onClick={handleProgressClick}
                            onMouseMove={handleProgressHover}
                            onMouseLeave={handleProgressLeave}
                            role="slider"
                            aria-label="Video progress"
                            aria-valuemin={0}
                            aria-valuemax={duration}
                            aria-valuenow={currentTime}
                            tabIndex={0}
                        >
                            <div
                                className="absolute left-0 top-0 h-full rounded-full bg-alpha-white/30"
                                style={{ width: `${bufferedProgress}%` }}
                            />
                            <div
                                className="absolute left-0 top-0 h-full rounded-full bg-fg-white"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-white text-xs font-semibold min-w-[42px]">
                            -{formatTime(duration - currentTime)}
                        </span>
                    </div>

                    {/* Captions Toggle */}
                    {tracks.length > 0 && size !== "sm" && (
                        <div className="relative">
                            <Button
                                onClick={() => setShowCaptionsMenu(!showCaptionsMenu)}
                                isDisabled={isControlDisabled}
                                variant="tertiary"
                                size="sm"
                                className={cn(
                                    "!p-2 text-white hover:!bg-alpha-white/20 !bg-transparent size-8",
                                    activeCaptionTrack >= 0 && "!bg-alpha-white/20"
                                )}
                                aria-label="Captions"
                                aria-expanded={showCaptionsMenu}
                            >
                                <span
                                    className="text-white font-semibold text-xs"
                                    aria-hidden="true"
                                >
                                    CC
                                </span>
                            </Button>
                            {showCaptionsMenu && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-md py-1 min-w-[120px] z-20">
                                    <button
                                        onClick={() => handleCaptionToggle(-1)}
                                        className={cn(
                                            "w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors",
                                            activeCaptionTrack === -1 && "bg-white/20"
                                        )}
                                    >
                                        Off
                                    </button>
                                    {tracks.map((track, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleCaptionToggle(index)}
                                            className={cn(
                                                "w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors",
                                                activeCaptionTrack === index && "bg-white/20"
                                            )}
                                        >
                                            {track.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Playback Speed */}
                    {size === "lg" && (
                        <div className="relative">
                            <Button
                                onClick={() => setShowRateMenu(!showRateMenu)}
                                isDisabled={isControlDisabled}
                                variant="tertiary"
                                size="sm"
                                className="!px-2 !py-1 text-white hover:!bg-alpha-white/20 !bg-transparent text-xs"
                                aria-label={`Playback speed: ${playbackRate}x`}
                                aria-expanded={showRateMenu}
                            >
                                <span className="text-white text-xs font-semibold">
                                    {playbackRate}x
                                </span>
                            </Button>
                            {showRateMenu && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-md py-1 min-w-[80px] z-20">
                                    {playbackRates.map(rate => (
                                        <button
                                            key={rate}
                                            onClick={() => {
                                                setPlaybackRate(rate);
                                                setShowRateMenu(false);
                                            }}
                                            className={cn(
                                                "w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors",
                                                playbackRate === rate && "bg-white/20"
                                            )}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Picture in Picture */}
                    {size !== "sm" && (
                        <Button
                            onClick={togglePictureInPicture}
                            isDisabled={isControlDisabled}
                            variant="tertiary"
                            size="sm"
                            className="!p-2 text-white hover:!bg-alpha-white/20 !bg-transparent"
                            aria-label="Picture in picture"
                        >
                            <svg
                                className="size-4 text-white"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <rect
                                    x="3"
                                    y="5"
                                    width="18"
                                    height="14"
                                    rx="2"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    fill="none"
                                />
                                <rect
                                    x="7"
                                    y="9"
                                    width="8"
                                    height="6"
                                    rx="1"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    fill="none"
                                />
                            </svg>
                        </Button>
                    )}

                    {/* Fullscreen */}
                    <Button
                        onClick={toggleFullscreen}
                        isDisabled={isControlDisabled}
                        variant="tertiary"
                        size="sm"
                        className="!p-2 text-white hover:!bg-alpha-white/20 !bg-transparent"
                        aria-label="Fullscreen"
                    >
                        <Maximize01 className="size-4 text-white" aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
