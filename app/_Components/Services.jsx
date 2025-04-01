import { CreditCard, Navigation } from "lucide-react";
import Image from "next/image";
import React from "react";

const servicesData = [
  {
    image: "/assets/ab3.jpg",
    profiles: ["/assets/ab3.jpg", "/assets/ab3.jpg", "/assets/ab3.jpg"],
    visited: "2K+ People Visited",
    buttonColor: "bg-primary",
    actions: [
      {
        icon: (
          <Navigation
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: "Send Money",
        description: "Take Acc to Acc",
      },
      {
        icon: (
          <CreditCard
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: "Pay The Bill",
        description: "Budget On Rent",
      },
    ],
  },
  {
    image: "/assets/ab3.jpg",
    profiles: ["/assets/ab3.jpg", "/assets/ab3.jpg", "/assets/ab3.jpg"],
    visited: "2K+ People Visited",
    buttonColor: "bg-blue-500",
    actions: [
      {
        icon: (
          <Navigation
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: "Send Money",
        description: "Take Acc to Acc",
      },
      {
        icon: (
          <CreditCard
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: "Pay The Bill",
        description: "Budget On Rent",
      },
    ],
  },
  {
    image: "/assets/ab3.jpg",
    profiles: ["/assets/ab3.jpg", "/assets/ab3.jpg", "/assets/ab3.jpg"],
    visited: "2K+ People Visited",
    buttonColor: "bg-blue-500",
    actions: [
      {
        icon: (
          <Navigation
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: "Send Money",
        description: "Take Acc to Acc",
      },
      {
        icon: (
          <CreditCard
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: "Pay The Bill",
        description: "Budget On Rent",
      },
    ],
  },
];

const Services = () => {
  return (
    <div className="container mx-auto py-20 p-8">
      <div className="pb-24 space-y-5">
        <h1
          className="text-4xl md:text-5xl font-semibold  capitalize"
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-easing="ease-in-out-back"
        >
          Take The First <span className="text-primary">Step</span>
        </h1>
        <p
          className="text-lg text-gray-500"
          data-aos="fade-up"
          data-aos-duration="1200"
          data-aos-easing="ease-in-out-back"
        >
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Consectetur,
          error.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-16">
        {servicesData.map((service, index) => (
          <div
            key={index}
            className="bg-white md:p-8 p-5 rounded-4xl shadow-md"
            data-aos="fade-down"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            <div>
              <Image
                src={service.image}
                alt="about"
                width={300}
                height={300}
                className="object-center w-full rounded-2xl"
                data-aos="zoom-in"
                data-aos-duration="1000"
                data-aos-easing="ease-in-out-back"
              />
              <div className="flex items-center space-x-2 mt-4 bg-gray-100 py-3 px-4 rounded-full">
                <div className="flex -space-x-2">
                  {service.profiles.map((profile, idx) => (
                    <img
                      key={idx}
                      className="w-8 h-8 rounded-full border-2 border-white"
                      src={profile}
                      alt={`Profile ${idx + 1}`}
                      data-aos="fade-down"
                      data-aos-duration="1200"
                      data-aos-easing="ease-in-out-back"
                    />
                  ))}
                </div>
                <span
                  className="text-gray-700 font-medium md:text-md text-xs"
                  data-aos="fade-right"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  {service.visited}
                </span>
                <button
                  className={`ml-auto ${service.buttonColor} text-white px-4 md:y-2 py-1 rounded-full`}
                  data-aos="fade-left"
                  data-aos-duration="1600"
                  data-aos-easing="ease-in-out-back"
                >
                  Visit
                </button>
              </div>
            </div>
            <div className="md:flex space-y-4 md:space-y-0 gap-10 pt-5 items-center justify-center w-full">
              {service.actions.map((action, idx) => (
                <div
                  key={idx}
                  className="p-5 md:p-9 rounded-2xl bg-gray-100 text-center flex flex-col items-center space-y-2 hover:bg-primary hover:text-white cursor-pointer hover:transition-all"
                  data-aos="flip-left"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                >
                  {action.icon}
                  <h1
                    className="mt-2 font-medium text-sm md:text-xl"
                    data-aos="zoom-in"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    {action.title}
                  </h1>
                  <p
                    className="text-xs md:text-md"
                    data-aos="zoom-in"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
