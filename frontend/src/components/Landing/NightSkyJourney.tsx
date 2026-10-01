import { Link } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { FiArrowRight, FiLock, FiStar } from "react-icons/fi"
import { A11y, Keyboard, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperInstance } from "swiper"

import publicNightSky from "../../assets/images/step3.webp"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import "./night-sky-journey.css"

const steps = [
  {
    title: "Save a memory",
    detail: "It becomes a star in your private night sky.",
    sky: "YOUR NIGHT SKY",
    status: "PRIVATE",
    caption: "Grandma’s kitchen",
    note: "One story, one new star.",
  },
  {
    title: "Make a constellation",
    detail: "Connect two or more stars and tell the story they share.",
    sky: "YOUR NIGHT SKY",
    status: "PRIVATE",
    caption: "Grandma’s summers",
    note: "Three connected memories, one editable story.",
  },
  {
    title: "Share if you choose",
    detail: "Preview it, then publish your constellation to the global sky.",
    sky: "GLOBAL NIGHT SKY",
    status: "SHARED BY CHOICE",
    caption: "Grandma’s summers",
    note: "Only the constellation you choose is shared.",
  },
] as const

const stars = [
  { title: "Grandma’s kitchen", className: "kitchen", color: "gold" },
  { title: "The garden gate", className: "garden", color: "mint" },
  { title: "A summer of stories beneath the apple tree", className: "summer", color: "lavender" },
  { title: "Sunday pancakes", className: "pancakes", color: "peach" },
] as const

export default function NightSkyJourney({ publicSkyEnabled }: { publicSkyEnabled: boolean }) {
  const [activeStep, setActiveStep] = useState(0)
  const [selectedStar, setSelectedStar] = useState(0)
  const swiperRef = useRef<SwiperInstance | null>(null)
  const journeySteps = publicSkyEnabled ? steps : [
    steps[0],
    steps[1],
    {
      ...steps[2],
      title: "Share when it opens",
      detail: "The global night sky is coming soon. Your sky stays private.",
      status: "COMING SOON",
      note: "A preview of sharing. Nothing is public yet.",
    },
  ]
  const showStep = (index: number) => {
    swiperRef.current?.slideTo(index)
  }

  return (
    <div className="journey-layout">
      <div className="journey-copy">
        <p className="journey-eyebrow">IT STARTS WITH A MEMORY</p>
        <h2>See how your memories become a story.</h2>
        <p className="journey-intro">
          Save each moment as a private star, then connect related stars into a
          constellation. {publicSkyEnabled
            ? "If you choose to share it, you decide which stories and images readers can open."
            : "Your stories stay private while the Global Night Sky takes shape."}
        </p>
        <div className="journey-steps" role="group" aria-label="Explore how MemriPlace works">
          {journeySteps.map((item, index) => (
            <button
              aria-pressed={activeStep === index}
              className={`journey-step ${activeStep === index ? "is-active" : ""}`}
              key={item.title}
              onClick={() => showStep(index)}
              type="button"
            >
              <span className="journey-step-number">{index + 1}</span>
              <span className="journey-step-words">
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </span>
              <FiArrowRight aria-hidden="true" className="journey-step-arrow" />
            </button>
          ))}
        </div>
        {publicSkyEnabled && (
          <Link className="journey-public-link" to="/night-sky">
            Explore the global night sky <FiArrowRight aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="journey-preview" role="region" aria-label="How memories become a constellation">
        <Swiper
          a11y={{ enabled: true, prevSlideMessage: "Previous step", nextSlideMessage: "Next step" }}
          className="journey-carousel"
          keyboard={{ enabled: true, onlyInViewport: true }}
          modules={[Navigation, Pagination, Keyboard, A11y]}
          navigation
          onSlideChange={(swiper) => {
            setActiveStep(swiper.activeIndex)
            setSelectedStar(0)
          }}
          onSwiper={(swiper) => { swiperRef.current = swiper }}
          pagination={{ clickable: true }}
          speed={420}
        >
          {journeySteps.map((step, slideIndex) => {
            const visibleStars = slideIndex === 0 ? stars.slice(0, 1) : stars
            return <SwiperSlide key={step.title}>
              <div className={`journey-sky journey-sky-${slideIndex}`} role="group" aria-label={`${slideIndex + 1} of ${journeySteps.length}: ${step.title}`}>
                <div className="journey-sky-heading">
                  <span>{step.sky}</span>
                  <span className="journey-status">{slideIndex === 2 && publicSkyEnabled ? <FiStar aria-hidden="true" /> : <FiLock aria-hidden="true" />} {step.status}</span>
                </div>
                <div className="journey-map" role="group" aria-label={slideIndex === 0
                  ? "One saved memory appears as a star in a private night sky"
                  : slideIndex === 1
                    ? "Three memories are connected into a private constellation; another star stays separate"
                    : publicSkyEnabled
                      ? "The chosen three-star constellation appears in the global night sky"
                      : "A preview of how the chosen three-star constellation could appear in the future global night sky"}
                >
                  {slideIndex === 2 ? (
                    <img
                      alt="A glowing three-star constellation among other stories in the global night sky"
                      className="journey-public-image"
                      decoding="async"
                      loading="lazy"
                      src={publicNightSky}
                    />
                  ) : <>
                  {slideIndex > 0 && (
                    <svg aria-hidden="true" className="journey-lines" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M 24 25 L 73 29 L 61 65 Z" />
                    </svg>
                  )}
                  {visibleStars.map((star, index) => (
                    <button
                      aria-label={`Select memory: ${star.title}`}
                      aria-pressed={activeStep === slideIndex && selectedStar === index}
                      className={`journey-star journey-star-${star.className} journey-star-${star.color} ${activeStep === slideIndex && selectedStar === index ? "is-selected" : ""}`}
                      key={star.title}
                      onClick={() => setSelectedStar(index)}
                      title={star.title}
                      type="button"
                    >
                      <span className="journey-star-shape"><FiStar aria-hidden="true" /></span>
                      <span className="journey-star-title">{star.title}</span>
                    </button>
                  ))}
                  </>}
                </div>
                <div className="journey-sky-caption">
                  <span>{step.caption}</span>
                  <small>{step.note}</small>
                </div>
              </div>
            </SwiperSlide>
          })}
        </Swiper>
      </div>
    </div>
  )
}
