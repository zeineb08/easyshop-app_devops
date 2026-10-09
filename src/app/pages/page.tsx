import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import {
  FiShoppingBag,
  FiMail,
  FiPercent,
  FiUser,
  FiPackage,
  FiCreditCard,
  FiArrowRight,
  FiLayers,
} from "react-icons/fi";

export const metadata: Metadata = {
  title: "Pages — EasyShop",
  description: "Explore all pages and sections available on EasyShop.",
};

const pagesList = [
  {
    title: "Shops",
    description: "Explore all specialized categories and stores.",
    url: "/shops",
    icon: FiShoppingBag,
  },
  {
    title: "Contact Us",
    description: "Get in touch with customer support and inquiries.",
    url: "/contact",
    icon: FiMail,
  },
  {
    title: "Special Offers",
    description: "Browse discounted items and seasonal promotions.",
    url: "/offers",
    icon: FiPercent,
  },
  {
    title: "User Profile",
    description: "Manage your personal account and preferences.",
    url: "/profile",
    icon: FiUser,
  },
  {
    title: "Orders",
    description: "Track your past and ongoing order shipments.",
    url: "/profile/orders",
    icon: FiPackage,
  },
  {
    title: "Checkout",
    description: "Review your selected items and complete purchases.",
    url: "/checkout",
    icon: FiCreditCard,
  },
];

const PagesHub = () => {
  return (
    <div className="container max-w-5xl py-12 px-default">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-3">
          <FiLayers className="text-2xl" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          All Pages
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Quickly navigate to any section of EasyShop.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {pagesList.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              href={item.url}
              className="group p-6 rounded-xl border bg-secondary hover:border-primary hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Icon className="text-xl" />
                </div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors duration-200">
                  {item.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1 text-sm font-medium text-primary group-hover:translate-x-1 transition-transform duration-200">
                <span>Visit page</span>
                <FiArrowRight />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PagesHub;
