import { CollectionCard } from "@/features/song-collections/components/CollectionCard.tsx";
import { Collection } from "@/features/song-collections/types.ts";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/features/ui/carousel.tsx";

interface SongCollectionsCarouselProps {
    collections: Collection[];
    title: string;
}

export function SongCollectionCarousel({ collections, title }: SongCollectionsCarouselProps) {
    const shouldLoop = collections.length > 4; // lg shows 4 at once

    return (
        <div className="w-9/10 mx-auto">
            <h2 className="text-xl font-bold mb-4 text-black">{title}</h2>

            <Carousel
                opts={{
                    align: "start",
                    loop: shouldLoop,
                }}
                className="w-full"
            >
                <div className="min-h-[120px]">
                    <CarouselContent>
                        {collections.length > 0 ? (
                            collections.map((collection) => (
                                <CarouselItem
                                    key={collection.uuid}
                                    className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                                >
                                    <CollectionCard collection={collection} size="medium" />
                                </CarouselItem>
                            ))
                        ) : (
                            <CarouselItem className="basis-full pl-0">
                                <div className="w-full text-center text-gray-500">
                                    No collections available
                                </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                </div>

                {collections.length > 0 && (
                    <>
                        <CarouselPrevious />
                        <CarouselNext />
                    </>
                )}
            </Carousel>
        </div>
    );
}
