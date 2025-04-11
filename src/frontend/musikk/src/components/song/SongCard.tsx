interface SongCardProps {
    title: string;
    artist: string;
    isPlaying: boolean;
    onClick: () => void;
}

export function SongCard(props: SongCardProps) {
    const isPlaying = props.isPlaying;

    return (
        <div className="flex items-center space-x-4 bg-main-gray p-3 rounded shadow hover:bg-main-red transition">
            <div className="flex flex-col">
                <span className="font-semibold">{props.title}</span>
                <span className="text-sm text-gray-600">{props.artist}</span>
            </div>
            <button
                onClick={props.onClick}
            >
                {isPlaying ? "pause" : "play"}
            </button>
        </div>
    );
}