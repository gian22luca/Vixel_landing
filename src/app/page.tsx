import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Formato from "@/components/sections/Formato";
import Loop from "@/components/sections/Loop";
import CityBreak from "@/components/sections/CityBreak";
import Red from "@/components/sections/Red";
import Audiencia from "@/components/sections/Audiencia";
import Franjas from "@/components/sections/Franjas";
import Tecnologia from "@/components/sections/Tecnologia";
import Planes from "@/components/sections/Planes";
import Soluciones from "@/components/sections/Soluciones";
import Flota from "@/components/sections/Flota";
import Contacto from "@/components/sections/Contacto";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <Formato />
        <Loop />
        <CityBreak img="/img/city-dusk.jpg" kicker="250 km por día · por unidad" top="Del Obelisco" bottom="a Devoto." />
        <Red />
        <Audiencia />
        <Franjas />
        <Tecnologia />
        <CityBreak img="/img/luneta-real-12.jpg" kicker="Ya circulando en Buenos Aires" top="Tu marca" bottom="en movimiento." />
        <Planes />
        <Soluciones />
        <Flota />
        <Contacto />
      </main>
    </>
  );
}
