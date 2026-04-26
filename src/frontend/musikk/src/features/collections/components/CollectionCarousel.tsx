import { CollectionCard } from "@/features/collections/components/CollectionCard.tsx";
import { Collection } from "@/features/collections/types.ts";
import { EmptyState } from "@/features/common/EmptyState.tsx";
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
                <div className="grid min-h-[120px] items-center">
                    {collections.length === 0 && (
                        <EmptyState variant="inline" message="No collections available" />
                    )}
                    {collections.length > 0 && (
                        <CarouselContent>
                            {collections.map((collection) => (
                                <CarouselItem key={collection.uuid} className="basis-1/5">
                                    <CollectionCard
                                        collection={collection}
                                        size="medium"
                                        className="w-full"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    )}
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
