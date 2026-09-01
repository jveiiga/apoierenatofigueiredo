"use client";

import Image from "next/image";
import {
  ChangeEvent,
  PointerEvent,
  useEffect,
  useState,
} from "react";

/* =========================================================
   CANVAS PRINCIPAL — STORY / REELS / STATUS
   NÃO ALTERAR
========================================================= */

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

/* =========================================================
   CANVAS WHATSAPP
========================================================= */

const WHATSAPP_CANVAS_WIDTH = 1080;
const WHATSAPP_CANVAS_HEIGHT = 1080;

/* =========================================================
   ÁREA DA FOTO — STORY / REELS / STATUS
   MEDIDAS ORIGINAIS — NÃO ALTERAR
========================================================= */

const PHOTO_AREA = {
  x: 20,
  y: 356,
  width: 1040,
  height: 1208,
};

/* =========================================================
   ÁREA DA FOTO — PERFIL WHATSAPP

   Mantida conforme a versão anterior.
========================================================= */

const PHOTO_AREA_WHATSAPP = {
  x: 20,
  y: 20,
  width: 1040,
  height: 1040,
};

/* =========================================================
   TIPOS
========================================================= */

type Usage = "story" | "whatsapp";

/* =========================================================
   FORMATOS
========================================================= */

const FORMATS = {
  story: {
    label: "Story",
    frame: "/moldura-story.png",
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    photoArea: PHOTO_AREA,
  },

  whatsapp: {
    label: "Perfil WhatsApp",
    frame: "/moldura-whatsapp.png",
    width: WHATSAPP_CANVAS_WIDTH,
    height: WHATSAPP_CANVAS_HEIGHT,
    photoArea: PHOTO_AREA_WHATSAPP,
  },
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function ApoiePage() {
  /* =======================================================
     FOTO
  ======================================================= */

  const [photo, setPhoto] = useState<File | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  /* =======================================================
     FORMATO
  ======================================================= */

  const [selectedUsage, setSelectedUsage] =
    useState<Usage>("story");

  /* =======================================================
     ZOOM
  ======================================================= */

  const [scale, setScale] = useState(1);

  /* =======================================================
     POSIÇÃO
  ======================================================= */

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  /* =======================================================
     ARRASTE
  ======================================================= */

  const [isDragging, setIsDragging] = useState(false);

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  /* =======================================================
     FORMATO ATUAL
  ======================================================= */

  const currentFormat = FORMATS[selectedUsage];

  /* =======================================================
     UPLOAD DA FOTO
  ======================================================= */

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    /* Libera a URL anterior */

    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }

    /* Cria nova URL */

    const url = URL.createObjectURL(file);

    setPhoto(file);
    setPhotoUrl(url);

    /* Reseta os ajustes */

    setScale(1);

    setPosition({
      x: 0,
      y: 0,
    });
  }

  /* =======================================================
     LIMPA URL DA FOTO
  ======================================================= */

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  /* =======================================================
     TROCA DE FORMATO
  ======================================================= */

  function handleFormatChange(usage: Usage) {
    setSelectedUsage(usage);

    /*
      Mantemos o comportamento original:
      ao trocar o formato, centraliza e reseta o zoom.
    */

    setScale(1);

    setPosition({
      x: 0,
      y: 0,
    });
  }

  /* =======================================================
     INÍCIO DO ARRASTE
  ======================================================= */

  function handlePointerDown(
    event: PointerEvent<HTMLDivElement>
  ) {
    if (!photoUrl) return;

    event.preventDefault();

    setIsDragging(true);

    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  /* =======================================================
     MOVIMENTO
  ======================================================= */

  function handlePointerMove(
    event: PointerEvent<HTMLDivElement>
  ) {
    if (!isDragging) return;

    const newX =
      event.clientX - dragStart.x;

    const newY =
      event.clientY - dragStart.y;

    setPosition({
      x: newX,
      y: newY,
    });
  }

  /* =======================================================
     FINAL DO ARRASTE
  ======================================================= */

  function handlePointerUp(
    event: PointerEvent<HTMLDivElement>
  ) {
    setIsDragging(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  }

  /* =======================================================
     CENTRALIZAR
  ======================================================= */

  function handleCenterPhoto() {
    setPosition({
      x: 0,
      y: 0,
    });
  }

  /* =======================================================
     CARREGAR IMAGEM
  ======================================================= */

  function loadImage(
    src: string
  ): Promise<HTMLImageElement> {
    return new Promise(
      (resolve, reject) => {
        const image =
          new window.Image();

        image.onload = () =>
          resolve(image);

        image.onerror = () =>
          reject(
            new Error(
              "Erro ao carregar a imagem."
            )
          );

        image.src = src;
      }
    );
  }

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  async function handleDownload() {
    if (!photoUrl) return;

    try {
      /* =====================================================
         CANVAS
      ===================================================== */

      const canvas =
        document.createElement("canvas");

      canvas.width =
        currentFormat.width;

      canvas.height =
        currentFormat.height;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) return;

      /*
        Melhora a qualidade da renderização
        sem alterar nenhuma medida do Canvas.
      */

      ctx.imageSmoothingEnabled = true;

      ctx.imageSmoothingQuality = "high";

      /* =====================================================
         CARREGA FOTO
      ===================================================== */

      const photoImage =
        await loadImage(photoUrl);

      /* =====================================================
         ÁREA DA FOTO
      ===================================================== */

      const photoArea =
        currentFormat.photoArea;

      /* =====================================================
         PROPORÇÃO ORIGINAL
      ===================================================== */

      const imageRatio =
        photoImage.width /
        photoImage.height;

      /* =====================================================
         PROPORÇÃO DA ÁREA
      ===================================================== */

      const areaRatio =
        photoArea.width /
        photoArea.height;

      let drawWidth: number;
      let drawHeight: number;

      /* =====================================================
         OBJECT-CONTAIN

         Esta é a lógica que estava no código antigo
         e que você informou que funcionava corretamente.

         NÃO usamos object-cover aqui.

         NÃO usamos clip().

         Isso evita cortes adicionais.
      ===================================================== */

      if (imageRatio > areaRatio) {
        /*
          Foto mais larga que a área.
        */

        drawWidth =
          photoArea.width;

        drawHeight =
          drawWidth /
          imageRatio;
      } else {
        /*
          Foto mais alta que a área.
        */

        drawHeight =
          photoArea.height;

        drawWidth =
          drawHeight *
          imageRatio;
      }

      /* =====================================================
         APLICA ZOOM
      ===================================================== */

      drawWidth *= scale;
      drawHeight *= scale;

      /* =====================================================
         POSIÇÃO CENTRAL

         Mantém exatamente a lógica do código antigo.
      ===================================================== */

      let drawX =
        photoArea.x +
        (
          photoArea.width -
          drawWidth
        ) /
          2;

      let drawY =
        photoArea.y +
        (
          photoArea.height -
          drawHeight
        ) /
          2;

      /* =====================================================
         ESCALA DO EDITOR

         Mantém a lógica original.

         O editor possui no máximo 448px.
      ===================================================== */

      const editorWidth =
        typeof window !== "undefined"
          ? Math.min(
              window.innerWidth - 40,
              448
            )
          : 448;

      const canvasScale =
        currentFormat.width /
        editorWidth;

      /* =====================================================
         POSIÇÃO DO USUÁRIO

         Converte a posição visual para Canvas.
      ===================================================== */

      drawX +=
        position.x *
        canvasScale;

      drawY +=
        position.y *
        canvasScale;

      /* =====================================================
         DESENHA FOTO

         IMPORTANTE:

         NÃO usamos ctx.clip().

         Isso evita os cortes adicionais nas extremidades
         que estavam acontecendo no download.
      ===================================================== */

      ctx.drawImage(
        photoImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );

      /* =====================================================
         CARREGA MOLDURA
      ===================================================== */

      const frameImage =
        await loadImage(
          currentFormat.frame
        );

      /* =====================================================
         MOLDURA SEMPRE POR CIMA

         A moldura ocupa exatamente o Canvas.

         NÃO altera as medidas.
      ===================================================== */

      ctx.drawImage(
        frameImage,
        0,
        0,
        currentFormat.width,
        currentFormat.height
      );

      /* =====================================================
         DOWNLOAD PNG
      ===================================================== */

      canvas.toBlob(
        (blob) => {
          if (!blob) return;

          const url =
            URL.createObjectURL(blob);

          const link =
            document.createElement("a");

          link.href = url;

          link.download =
            `apoie-renato-figueiredo-${selectedUsage}.png`;

          document.body.appendChild(
            link
          );

          link.click();

          document.body.removeChild(
            link
          );

          /*
            Libera a URL depois do download.
          */

          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
        },
        "image/png"
      );
    } catch (error) {
      console.error(
        "Erro ao gerar imagem:",
        error
      );
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-white px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center">

        {/* =================================================
            LOGO
        ================================================= */}

        <Image
          src="/logo-renato.png"
          alt="Renato Figueiredo"
          width={200}
          height={80}
          priority
          style={{
            width: "200px",
            height: "auto",
          }}
        />

        {/* =================================================
            TÍTULO
        ================================================= */}

        <h1 className="mt-6 text-center text-3xl font-bold text-black">
          Apoie Renato Figueiredo
        </h1>

        {/* =================================================
            DESCRIÇÃO
        ================================================= */}

        <p className="mt-3 text-center text-gray-600">
          Coloque sua foto e faça parte desse movimento.
        </p>

        {/* =================================================
            ESCOLHA DO FORMATO
        ================================================= */}

        <div className="mt-8 w-full">

          <p className="mb-3 text-sm font-semibold text-black">
            Onde você vai usar sua foto?
          </p>

          <div className="grid grid-cols-2 gap-2">

            {/* STORY */}

            <button
              type="button"
              onClick={() =>
                handleFormatChange("story")
              }
              className={`
                rounded-lg
                border
                px-3
                py-3
                text-sm
                font-medium
                transition
                ${
                  selectedUsage === "story"
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-black hover:bg-gray-100"
                }
              `}
            >
              Story
            </button>

            {/* WHATSAPP */}

            <button
              type="button"
              onClick={() =>
                handleFormatChange("whatsapp")
              }
              className={`
                rounded-lg
                border
                px-3
                py-3
                text-sm
                font-medium
                transition
                ${
                  selectedUsage === "whatsapp"
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-black hover:bg-gray-100"
                }
              `}
            >
              Perfil WhatsApp
            </button>

          </div>
        </div>

        {/* =================================================
            EDITOR
        ================================================= */}

        <div className="mt-8 w-full">

          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: `${currentFormat.width} / ${currentFormat.height}`,
            }}
          >

            {/* =============================================
                FOTO
            ============================================= */}

            {photoUrl ? (
              <div
                className="absolute"
                style={{
                  left: `${
                    (
                      currentFormat.photoArea.x /
                      currentFormat.width
                    ) * 100
                  }%`,

                  top: `${
                    (
                      currentFormat.photoArea.y /
                      currentFormat.height
                    ) * 100
                  }%`,

                  width: `${
                    (
                      currentFormat.photoArea.width /
                      currentFormat.width
                    ) * 100
                  }%`,

                  height: `${
                    (
                      currentFormat.photoArea.height /
                      currentFormat.height
                    ) * 100
                  }%`,
                }}
              >

                <div
                  className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
                  onPointerDown={
                    handlePointerDown
                  }
                  onPointerMove={
                    handlePointerMove
                  }
                  onPointerUp={
                    handlePointerUp
                  }
                  onPointerCancel={
                    handlePointerUp
                  }
                  style={{
                    transform: `
                      translate(
                        ${position.x}px,
                        ${position.y}px
                      )
                      scale(${scale})
                    `,

                    transformOrigin:
                      "center center",
                  }}
                >

                  {/* 
                    Usamos img em vez de next/image
                    para a URL blob criada pelo navegador.

                    object-contain mantém a lógica original
                    e evita cortar a parte superior da foto.
                  */}

                  <img
                    src={photoUrl}
                    alt="Foto selecionada"
                    draggable={false}
                    className="block h-full w-full select-none object-contain"
                  />

                </div>
              </div>
            ) : null}

            {/* =============================================
                MOLDURA
            ============================================= */}

            <div className="pointer-events-none absolute inset-0 z-10">

              <Image
                src={currentFormat.frame}
                alt={`Moldura para ${currentFormat.label}`}
                fill
                priority
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-fill"
              />

            </div>

          </div>
        </div>

        {/* =================================================
            UPLOAD
        ================================================= */}

        <label
          htmlFor="photo-upload"
          className="mt-8 cursor-pointer rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
        >
          {photo
            ? "Trocar minha foto"
            : "Escolher minha foto"}
        </label>

        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={
            handlePhotoChange
          }
          className="hidden"
        />

        {/* =================================================
            CONTROLES
        ================================================= */}

        {photoUrl ? (
          <>

            {/* =============================================
                ZOOM
            ============================================= */}

            <div className="mt-6 w-full">

              <div className="mb-2 flex items-center justify-between">

                <span className="text-sm font-medium text-black">
                  Ajustar tamanho
                </span>

                <span className="text-sm text-gray-500">
                  {Math.round(
                    scale * 100
                  )}
                  %
                </span>

              </div>

              <input
                type="range"
                min="0.5"
                max="2"
                step="0.01"
                value={scale}
                onChange={(event) =>
                  setScale(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-full"
              />

            </div>

            {/* =============================================
                CENTRALIZAR
            ============================================= */}

            <button
              type="button"
              onClick={
                handleCenterPhoto
              }
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              ↺ Centralizar foto
            </button>

            {/* =============================================
                DOWNLOAD
            ============================================= */}

            <button
              type="button"
              onClick={
                handleDownload
              }
              className="mt-4 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              Baixar foto
            </button>

          </>
        ) : null}

        {/* =================================================
            ARQUIVO
        ================================================= */}

        {photo ? (
          <p className="mt-3 text-center text-sm text-gray-500">
            {photo.name}
          </p>
        ) : null}

      </div>
    </main>
  );
}

