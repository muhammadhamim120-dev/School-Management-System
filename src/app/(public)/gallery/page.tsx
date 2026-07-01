import { PageHero } from "@/components/public/page-hero";

const images = [
  { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80", caption: "Campus Life" },
  { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80", caption: "Classroom Learning" },
  { src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&q=80", caption: "Library" },
  { src: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80", caption: "Sports" },
  { src: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&q=80", caption: "Science Lab" },
  { src: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80", caption: "Events" },
  { src: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80", caption: "Reading Corner" },
  { src: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80", caption: "Group Study" },
  { src: "https://images.unsplash.com/photo-1560785496-3c9d27877182?w=600&q=80", caption: "Art Class" },
];

export default function GalleryPage() {
  return (
    <>
      <PageHero title="Gallery" subtitle="A glimpse into life at Greenwood International School." />
      <section className="container py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl border">
              <img
                src={img.src}
                alt={img.caption}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="font-medium text-white">{img.caption}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
