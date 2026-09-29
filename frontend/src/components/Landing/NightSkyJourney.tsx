import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { FiArrowRight, FiLock, FiStar } from "react-icons/fi"

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
    detail: "Preview it, then publish your constellation to the public sky.",
    sky: "PUBLIC NIGHT SKY",
    status: "SHARED BY CHOICE",
    caption: "Grandma’s summers",
    note: "Only the constellation you choose is shared.",
  },
] as const

const stars = [
  { title: "Grandma’s kitchen", className: "kitchen", color: "gold" },
  { title: "The garden gate", className: "garden", color: "mint" },
  { title: "Summer stories", className: "summer", color: "lavender" },
  { title: "Sunday pancakes", className: "pancakes", color: "peach" },
] as const

export default function NightSkyJourney({ publicSkyEnabled }: { publicSkyEnabled: boolean }) {
  const [activeStep, setActiveStep] = useState(0)
  const journeySteps = publicSkyEnabled ? steps : [
    steps[0],
    steps[1],
    {
      ...steps[2],
      title: "Share when it opens",
      detail: "The public night sky is coming soon. Your sky stays private.",
      status: "COMING SOON",
      note: "A preview of sharing. Nothing is public yet.",
    },
  ]
  const step = journeySteps[activeStep]
  const visibleStars = activeStep === 0 ? stars.slice(0, 1) : activeStep === 2 ? stars.slice(0, 3) : stars

  return (
    <div className="journey-layout">
      <div className="journey-copy">
        <p className="journey-eyebrow">IT STARTS WITH A MEMORY</p>
        <h2>Your memories are stars. You're stories are constellations.</h2>
        <p className="journey-intro">
          Your memories live as stars in your own Night Sky. When you connect stars together
          it forms a story constellation. You can choose to keep your constellations private
          or share share them on the shared Global Night Sky.
          {/*or share it on the public Night Sky{publicSkyEnabled*/}
          {/*  ? "Then decide whether the world gets to see it."*/}
          {/*  : "Public sharing is coming soon."}*/}
        </p>
        <div className="journey-steps" role="group" aria-label="Explore how MemriPlace works">
          {journeySteps.map((item, index) => (
            <button
              aria-pressed={activeStep === index}
              className={`journey-step ${activeStep === index ? "is-active" : ""}`}
              key={item.title}
              onClick={() => setActiveStep(index)}
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
            Explore the public night sky <FiArrowRight aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="journey-preview" aria-label="Illustration of a memory becoming a shareable constellation">
        <div className="journey-preview-top">
          <span><FiStar aria-hidden="true" /> A sky of stories</span>
          <span>Interactive example</span>
        </div>
        <div className={`journey-sky journey-sky-${activeStep}`}>
          <div className="journey-sky-heading">
            <span>{step.sky}</span>
            <span className="journey-status">{activeStep === 2 && publicSkyEnabled ? <FiStar aria-hidden="true" /> : <FiLock aria-hidden="true" />} {step.status}</span>
          </div>
          <div className="journey-map" role="img" aria-label={activeStep === 0
            ? "One saved memory appears as a star in a private night sky"
            : activeStep === 1
              ? "Three memories are connected into a private constellation; another star stays separate"
              : publicSkyEnabled
                ? "The chosen three-star constellation appears in the public night sky"
                : "A preview of how the chosen three-star constellation could appear in the future public night sky"}
          >
            {activeStep === 2 && <div aria-hidden="true" className="journey-distant-stars">✦ <span>✧</span> ✦</div>}
            {activeStep > 0 && (
              <svg aria-hidden="true" className="journey-lines" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 24 25 L 73 29 L 61 65 Z" />
              </svg>
            )}
            {visibleStars.map((star) => (
              <div className={`journey-star journey-star-${star.className} journey-star-${star.color}`} key={star.title}>
                <span className="journey-star-shape"><FiStar aria-hidden="true" /></span>
                <span className="journey-star-title">{star.title}</span>
              </div>
            ))}
          </div>
          <div aria-live="polite" className="journey-sky-caption">
            <span>{step.caption}</span>
            <small>{step.note}</small>
          </div>
        </div>
        <div className="journey-preview-bottom">
          <span>{String(activeStep + 1).padStart(2, "0")} / 03</span>
          <span>Tap a step to see the sky change</span>
        </div>
      </div>
    </div>
  )
}
