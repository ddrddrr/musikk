import { SongCard } from "@/components/songs/SongCard.tsx";
import { ISong } from "@/components/songs/types.ts";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface SongCarouselProps {
    songs: ISong[];
    title: string;
}

export function SongCarousel({ songs, title }: SongCarouselProps) {
    return (
        <div className="w-9/10 mx-auto px-4">
            <h2 className="text-xl font-bold mb-4 text-black">{title}</h2>
            <div className="relative">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselPrevious />
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {songs.map((song) => (
                            <CarouselItem key={song.uuid} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                                <SongCard song={song} size={"medium"} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselNext />
                </Carousel>
            </div>
        </div>
    );
}
