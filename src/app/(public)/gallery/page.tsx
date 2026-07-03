import { PageHero } from "@/components/public/page-hero";
import { Reveal } from "@/components/public/section";

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
      <PageHero eyebrow="Moments" title="Gallery" subtitle="A glimpse into life at Greenwood International School." />
      <section className="container py-12 sm:py-16">
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {images.map((img, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06}>
              <div className="group relative overflow-hidden rounded-2xl border border-border/60 shadow-soft">
                {/* eslint-disable-next-line @next/next/no-img-element -- gallery thumbnail, remote host */}
                <img
                  src={img.src}
                  alt={img.caption}
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.06] ${i % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"}`}
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="font-medium text-white">{img.caption}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
