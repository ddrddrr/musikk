import { SongCollectionCard } from "@/components/song-collections/SongCollectionCard";
import { ISongCollection } from "@/components/song-collections/types.ts";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface SongCollectionsCarouselProps {
    collections: ISongCollection[];
    title: string;
}

export function SongCollectionCarousel({ collections, title }: SongCollectionsCarouselProps) {
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
                        {collections.length > 0 ? (
                            collections.map((collection) => (
                                <CarouselItem
                                    key={collection.uuid}
                                    className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                                >
                                    <SongCollectionCard collection={collection} size="medium" />
                                </CarouselItem>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 w-full">No collections available</div>
                        )}
                    </CarouselContent>
                    {collections.length > 0 && (
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
