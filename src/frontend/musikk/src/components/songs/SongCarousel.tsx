import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { SongCard } from "@/components/songs/SongCard.tsx";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface SongCarouselProps {
    songs: ISongCollectionSong[];
    title: string;
}

export function SongCarousel({ songs, title }: SongCarouselProps) {
    return (
        <div className="w-9/10 mx-auto">
            <h2 className="text-xl font-bold mb-4 text-black">{title}</h2>
            <div className="relative">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-0 min-h-[120px] flex items-center justify-center">
                        {songs.length > 0 ? (
                            songs.map((song) => (
                                <CarouselItem
                                    key={song.uuid}
                                    className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                                >
                                    <SongCard collectionSong={song} size={"medium"} />
                                </CarouselItem>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 w-full">No songs available</div>
                        )}
                    </CarouselContent>
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
