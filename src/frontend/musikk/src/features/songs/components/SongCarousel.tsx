import { CollectionSong } from "@/features/collections/types.ts";
import { EmptyState } from "@/features/common/EmptyState.tsx";
import { SongCard } from "@/features/songs/components/SongCard.tsx";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/features/ui/carousel.tsx";

interface SongCarouselProps {
    songs: CollectionSong[];
    title: string;
}

export function SongCarousel({ songs, title }: SongCarouselProps) {
    return (
        <div className="mx-auto w-9/10">
            <h2 className="mb-4 text-xl font-bold text-foreground">{title}</h2>
            <div className="relative">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    {songs.length === 0 && (
                        <EmptyState
                            variant="inline"
                            message="No songs available"
                            className="min-h-[120px] content-center"
                        />
                    )}
                    {songs.length > 0 && (
                        <CarouselContent className="-ml-0 flex min-h-[120px] items-center justify-center">
                            {songs.map((song) => (
                                <CarouselItem
                                    key={song.uuid}
                                    className="basis-1/2 pl-2 md:basis-1/3 md:pl-4 lg:basis-1/4"
                                >
                                    <SongCard collectionSong={song} size={"medium"} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    )}
                    {songs.length > 0 && (
                        <>
                            <CarouselPrevious />
                            <CarouselNext />
                        </>
                    )}
                </Carousel>
            </div>
        </div>
    );
}
