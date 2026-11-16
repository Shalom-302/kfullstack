"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
    Play,
    VolumeMax,
    VolumeX,
    Download01,
    SkipBack,
    SkipForward,
    Repeat01,
} from "@untitled-ui/icons-react";
// 🎯 Importation du composant Button
import { Button } from "@/components/ui/button"; // Ajustez le chemin si nécessaire

// Définitions de l'interface AudioPlayerProps (inchangées)
interface AudioPlayerProps {
    src: string;
    title?: string;
    artist?: string;
    album?: string;
    coverImage?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    onDownload?: () => void;
    onError?: (error: Error) => void;
}

export function AudioPlayer({
    src,
    title,
    artist,
    album,
    coverImage,
    size = "md",
    className,
    onDownload,
    onError,
}: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("audioPlayerVolume");
                return saved ? parseFloat(saved) : 0.8;
            } catch (e) {
                console.error("Could not access localStorage", e);
                return 0.8;
            }
        }
        return 0.8;
    });
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [loop, setLoop] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showRateMenu, setShowRateMenu] = useState(false);
    const [isVolumeDragging, setIsVolumeDragging] = useState(false);
    const [isProgressDragging, setIsProgressDragging] = useState(false);

    const sizeClasses = {
        sm: "max-w-[320px]",
        md: "max-w-[560px]",
        lg: "max-w-[720px]",
    };

    const visualizerBars = {
        sm: 15,
        md: 25,
        lg: 35,
    };

    const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

    // --- LOGIQUE INCHANGÉE (Volume, Synchronisation DOM, Événements Audio, Raccourcis Clavier) ---
    // Persistance du volume
    useEffect(() => {
        try {
            localStorage.setItem("audioPlayerVolume", volume.toString());
        } catch {
            console.warn("Could not save volume to localStorage");
        }
    }, [volume]);

    // Synchronisation Loop & PlaybackRate
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.loop = loop;
    }, [loop]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.playbackRate = playbackRate;
    }, [playbackRate]);

    // Synchronisation du volume
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    // Gestion des événements Audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };
        const handleTimeUpdate = () => {
            if (!isProgressDragging) {
                setCurrentTime(audio.currentTime);
            }
        };
        const handleEnded = () => {
            if (!loop) {
                setIsPlaying(false);
                setCurrentTime(0);
            }
        };
        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleError = () => {
            setHasError(true);
            setIsLoading(false);
            if (onError) {
                const error = audio.error
                    ? new Error(`Audio Error: Code ${audio.error.code}`)
                    : new Error("Failed to load audio");
                onError(error);
            }
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("waiting", handleWaiting);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("waiting", handleWaiting);
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("error", handleError);
        };
    }, [loop, onError, isProgressDragging]);

    // Gestion du changement de SRC
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setIsLoading(true);
        setHasError(false);
        setShowRateMenu(false);

        const audio = audioRef.current;
        if (audio) {
            audio.load();
        }
    }, [src]);

    // Fonctions de contrôle
    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || isLoading || hasError) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(e => {
                console.error("Failed to play audio:", e);
                setHasError(true);
            });
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying, isLoading, hasError]);

    const handleSkip = useCallback(
        (seconds: number) => {
            const audio = audioRef.current;
            if (!audio || isLoading || hasError) return; // Sécurité
            const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
            audio.currentTime = newTime;
            setCurrentTime(newTime);
        },
        [isLoading, hasError]
    );

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const toggleLoop = useCallback(() => {
        setLoop(prev => !prev);
    }, []);

    // Fonctions de glissement (Drag) pour Volume et Progression (Inchangées)
    const updateVolumeFromEvent = useCallback(
        (e: MouseEvent | React.MouseEvent<HTMLDivElement> | TouchEvent) => {
            const volumeBar = volumeBarRef.current;
            if (!volumeBar) return;
            const clientX = "clientX" in e ? e.clientX : (e as TouchEvent).touches[0].clientX;
            const rect = volumeBar.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            setVolume(pos);
            if (pos === 0) {
                setIsMuted(true);
            } else {
                setIsMuted(false);
            }
        },
        []
    );

    const updateProgressFromEvent = useCallback(
        (e: MouseEvent | React.MouseEvent<HTMLDivElement> | TouchEvent) => {
            const audio = audioRef.current;
            const progressBar = progressBarRef.current;
            if (!audio || !progressBar || duration === 0) return;
            const clientX = "clientX" in e ? e.clientX : (e as TouchEvent).touches[0].clientX;
            const rect = progressBar.getBoundingClientRect();
            const pos = (clientX - rect.left) / rect.width;
            const newTime = pos * duration;
            audio.currentTime = newTime;
            setCurrentTime(newTime);
        },
        [duration]
    );

    const handleProgressDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (duration === 0) return;
        setIsProgressDragging(true);
        updateProgressFromEvent(e);
    };

    const handleVolumeDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsVolumeDragging(true);
        updateVolumeFromEvent(e);
    };

    useEffect(() => {
        const handleDrag = (e: MouseEvent) => {
            if (isVolumeDragging) {
                updateVolumeFromEvent(e);
            } else if (isProgressDragging) {
                updateProgressFromEvent(e);
            }
        };

        const handleStopDrag = () => {
            setIsVolumeDragging(false);
            setIsProgressDragging(false);
        };

        if (isVolumeDragging || isProgressDragging) {
            window.addEventListener("mousemove", handleDrag);
            window.addEventListener("mouseup", handleStopDrag);
        }

        return () => {
            window.removeEventListener("mousemove", handleDrag);
            window.removeEventListener("mouseup", handleStopDrag);
        };
    }, [isVolumeDragging, isProgressDragging, updateVolumeFromEvent, updateProgressFromEvent]);

    // Raccourcis clavier (Inchangés)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const audio = audioRef.current;
            if (!audio) return;

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
                    handleSkip(-5);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    handleSkip(5);
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
                case "l":
                    e.preventDefault();
                    toggleLoop();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [togglePlay, toggleLoop, toggleMute, handleSkip]);
    // --- FIN LOGIQUE INCHANGÉE ---

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const volumeProgress = isMuted ? 0 : volume * 100;

    const formatTime = (time: number) => {
        if (isNaN(time) || time < 0) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    // Condition pour désactiver les boutons
    const isControlDisabled = isLoading || hasError;

    return (
        <div
            className={cn(
                "rounded-lg overflow-hidden bg-alpha-white shadow-xs border border-gray-200 w-full",
                sizeClasses[size],
                className
            )}
            role="region"
            aria-label="Audio player"
        >
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* ... Header et Visualizer (Inchangés) ... */}

            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    {coverImage ? (
                        <Image
                            src={coverImage}
                            alt={title || "Audio cover"}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-md object-cover ring-1 ring-gray-200"
                            style={{ objectFit: "cover" }}
                            priority={true}
                        />
                    ) : (
                        <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center ring-1 ring-gray-200">
                            <svg
                                className="w-8 h-8 text-fg-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                            >
                                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h3 className="text-md font-semibold text-fg-primary truncate">
                                {title}
                            </h3>
                        )}
                        {artist && <p className="text-sm text-fg-secondary truncate">{artist}</p>}
                        {album && <p className="text-xs text-fg-tertiary truncate">{album}</p>}
                    </div>
                </div>
            </div>

            <div className="px-6 pt-6">
                <div className="h-20 bg-gray-50 rounded-md relative overflow-hidden flex items-center justify-center border border-gray-200">
                    {hasError ? (
                        <div className="text-center text-fg-error">
                            <p className="text-sm font-medium">Error loading audio</p>
                            <p className="text-xs">Check console for details.</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center space-x-1">
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-gray-300 rounded animate-pulse"
                                    style={{
                                        height: `${30 + i * 5}%`,
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full space-x-1 px-4">
                            {[...Array(visualizerBars[size])].map((_, i) => {
                                const baseHeight = Math.sin(i / 3) * 30 + 40;
                                const randomVariation = isPlaying ? Math.random() * 30 : 0;
                                const height = baseHeight + randomVariation;

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-1 bg-brand-500 rounded transition-all duration-150",
                                            isPlaying && "animate-pulse"
                                        )}
                                        style={{
                                            height: `${height}%`,
                                            animationDelay: `${i * 0.05}s`,
                                        }}
                                        aria-hidden="true"
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="p-6">
                {/* Progress Bar (Inchangé car ce n'est pas un Button) */}
                <div className="mb-4">
                    <div
                        ref={progressBarRef}
                        className={cn(
                            "relative h-2 bg-gray-200 rounded-full cursor-pointer group",
                            isControlDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}
                        onMouseDown={handleProgressDragStart}
                        onClick={updateProgressFromEvent}
                        role="slider"
                        aria-label="Audio progress"
                        aria-valuemin={0}
                        aria-valuemax={Math.floor(duration)}
                        aria-valuenow={Math.floor(currentTime)}
                        tabIndex={0}
                    >
                        {isLoading && (
                            <div className="absolute left-0 top-0 h-full bg-gray-300 rounded-full w-full animate-pulse" />
                        )}

                        <div
                            className="absolute left-0 top-0 h-full bg-brand-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        >
                            <div
                                className={cn(
                                    "absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-500 rounded-full transition-opacity shadow-sm",
                                    isProgressDragging || isControlDisabled
                                        ? "opacity-100"
                                        : "opacity-0 group-hover:opacity-100"
                                )}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-fg-quaternary font-medium">
                            {formatTime(currentTime)}
                        </span>
                        <span className="text-xs text-fg-quaternary font-medium">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                    {/* Left controls */}
                    <div className="flex items-center gap-2">
                        {/* 1. Skip Back */}
                        <Button
                            onClick={() => handleSkip(-10)}
                            isDisabled={isControlDisabled}
                            variant="tertiary"
                            size="sm"
                            aria-label="Skip backward 10 seconds"
                            leftIcon={<SkipBack className="w-5 h-5 text-fg-secondary" />}
                        />

                        {/* 2. Play / Pause */}
                        <Button
                            onClick={togglePlay}
                            isLoading={isLoading}
                            isDisabled={isControlDisabled}
                            variant="primary"
                            size="lg"
                            aria-label={isPlaying ? "Pause" : "Play"}
                            leftIcon={
                                isPlaying ? (
                                    <svg
                                        className="w-5 h-5 text-fg-white"
                                        fill="white"
                                        viewBox="0 0 20 20"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M6 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm7 0a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : (
                                    <Play className="w-5 h-5 text-fg-white fill-white " />
                                )
                            }
                        />

                        {/* 3. Skip Forward */}
                        <Button
                            onClick={() => handleSkip(10)}
                            isDisabled={isControlDisabled}
                            variant="tertiary"
                            size="sm"
                            aria-label="Skip forward 10 seconds"
                            leftIcon={<SkipForward className="w-5 h-5 text-fg-secondary" />}
                        />
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-3">
                        {/* 4. Loop */}
                        <Button
                            onClick={toggleLoop}
                            isDisabled={isControlDisabled}
                            variant="tertiary"
                            size="sm"
                            className={cn(
                                loop && "!bg-brand-50 !text-brand-600 hover:!bg-brand-100"
                            )}
                            aria-label={loop ? "Disable loop" : "Enable loop"}
                            aria-pressed={loop}
                            leftIcon={<Repeat01 className="w-5 h-5 text-fg-secondary" />}
                        />

                        {/* Playback speed (lg only) */}
                        {size === "lg" && (
                            <div className="relative">
                                <Button
                                    onClick={() => setShowRateMenu(!showRateMenu)}
                                    isDisabled={isControlDisabled}
                                    variant="secondary"
                                    size="sm"
                                    className="px-3 py-1.5 text-sm font-medium"
                                    aria-label={`Playback speed: ${playbackRate}x`}
                                    aria-expanded={showRateMenu}
                                >
                                    {playbackRate}x
                                </Button>
                                {showRateMenu && !isControlDisabled && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-alpha-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[80px] z-10">
                                        {playbackRates.map(rate => (
                                            <button
                                                key={rate}
                                                onClick={() => {
                                                    setPlaybackRate(rate);
                                                    setShowRateMenu(false);
                                                }}
                                                // Utilisation d'un bouton simple ou d'un <a> ici est acceptable pour le menu
                                                className={cn(
                                                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors text-fg-secondary",
                                                    playbackRate === rate &&
                                                        "bg-brand-50 text-brand-600 font-medium"
                                                )}
                                            >
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Volume */}
                        {size !== "sm" && (
                            <div className="flex items-center gap-2">
                                {/* 5. Mute */}
                                <Button
                                    onClick={toggleMute}
                                    isDisabled={isControlDisabled}
                                    variant="tertiary"
                                    size="sm"
                                    className="!p-2"
                                    aria-label={isMuted ? "Unmute" : "Mute"}
                                    leftIcon={
                                        isMuted || volume === 0 ? (
                                            <VolumeX className="w-5 h-5 text-fg-secondary" />
                                        ) : (
                                            <VolumeMax className="w-5 h-5 text-fg-secondary" />
                                        )
                                    }
                                />
                                {/* Volume Bar (Inchangé car ce n'est pas un Button) */}
                                <div
                                    ref={volumeBarRef}
                                    className={cn(
                                        "relative h-1 w-20 rounded-full bg-gray-200 group",
                                        isControlDisabled
                                            ? "cursor-not-allowed opacity-50 pointer-events-none"
                                            : "cursor-pointer"
                                    )}
                                    onMouseDown={handleVolumeDragStart}
                                    onClick={updateVolumeFromEvent}
                                    role="slider"
                                    aria-label="Volume"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(volumeProgress)}
                                    tabIndex={0}
                                >
                                    <div
                                        className="absolute left-0 top-0 h-full rounded-full bg-brand-500"
                                        style={{ width: `${volumeProgress}%` }}
                                    >
                                        <div
                                            className={cn(
                                                "absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-500 rounded-full transition-opacity shadow-sm",
                                                isVolumeDragging || isControlDisabled
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-100"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. Download */}
                        {onDownload && (
                            <Button
                                onClick={onDownload}
                                isDisabled={isControlDisabled}
                                variant="tertiary"
                                size="sm"
                                className="!p-2"
                                aria-label="Download audio"
                                leftIcon={<Download01 className="w-5 h-5 text-fg-secondary" />}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
