import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { Collection } from "@/features/collections/types.ts";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/features/ui/carousel.tsx";

interface CollectionsCarouselProps {
    collections: Collection[];
    title: string;
}

export function CollectionCarousel({ collections, title }: CollectionsCarouselProps) {
    const shouldLoop = collections.length > 4; // lg shows 4 at once

    return (
        <div className="mx-auto w-9/10">
            <h2 className="mb-4 text-xl font-bold text-foreground">{title}</h2>

            <Carousel
                opts={{
                    align: "start",
                    loop: shouldLoop,
                }}
                className="w-full"
            >
                <div className="flex min-h-[120px] items-center">
                    <CarouselContent>
                        {collections.length > 0 ? (
                            collections.map((collection) => (
                                <CarouselItem key={collection.uuid} className="basis-1/5 pl-2 pl-4">
                                    <CollectionCard collection={collection} size="medium" />
                                </CarouselItem>
                            ))
                        ) : (
                            <CarouselItem className="basis-full pl-0">
                                <div className="w-full text-center text-muted-foreground">
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
