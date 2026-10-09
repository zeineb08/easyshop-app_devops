import Logo from "@/assets/Logo";
import { AnimatePresence, Variants, motion } from "framer-motion";
import Link from "next/link";
import React, { useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import { ToggleTheme } from "./ToggleTheme";
import { IoChevronDownOutline } from "react-icons/io5";

const ContainerVariants: Variants = {
  hidden: {
    x: "-100%",
    visibility: "hidden",
  },
  visible: {
    x: 0,
    visibility: "visible",
    transition: {
      duration: 0.4,
      when: "beforeChildren",
    },
  },
  exit: {
    x: "-100%",
    visibility: "hidden",
    transition: {
      when: "afterChildren",
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: "-100%",
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "tween",
    },
  },
  exit: {
    opacity: 0,
    x: "-100%",
  },
};

type MobileMenuProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const links = [
  {
    title: "Shops",
    url: "/shops",
  },
  {
    title: "Contact",
    url: "/contact",
  },

  {
    title: "Offers",
    url: "/offers",
  },
  {
    title: "Pages",
    url: "/pages",
    subLinks: [
      {
        title: "Profile",
        url: "/profile",
      },
      {
        title: "Contact Us",
        url: "/contact",
      },
      {
        title: "Checkout",
        url: "/checkout",
      },
      {
        title: "Orders",
        url: "/profile/orders",
      },
    ],
  },
];

const MobileMenu = ({ isOpen, setIsOpen }: MobileMenuProps) => {
  const [openDrop, setOpenDrop] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={ContainerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mobile-menu fixed top-0 left-0 w-full h-screen z-[99]"
        >
          <div
            className="fixed top-0 left-0 w-full h-screen bg-black/60"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            variants={itemVariants}
            className="menu relative z-50 w-full max-w-xs bg-secondary h-full overflow-auto"
          >
            <div className="header flex justify-between items-center px-5 py-4 border-b border-input">
              <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center">
                <Logo />
              </Link>

              <button
                type="button"
                className="text-xl p-1 h-6 w-6 bg-primary rounded-full flex justify-center items-center text-white"
                onClick={() => setIsOpen(false)}
                title="close"
              >
                <HiOutlineXMark />
              </button>
            </div>

            <ul className="px-5 relative mt-3">
              <li className="absolute top-0 right-4">
                <ToggleTheme />
              </li>
              {links.map((link) => (
                <li key={link.title}>
                  <div className="flex justify-between items-center w-full px-4 py-2 transition-colors hover:text-primary hover:bg-accent rounded-md">
                    <Link
                      href={link.url}
                      className="flex-1"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.title}
                    </Link>
                    {link.subLinks && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDrop(!openDrop);
                        }}
                        className="p-1 hover:text-primary"
                        aria-label="Toggle submenu"
                      >
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            openDrop ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          <IoChevronDownOutline />
                        </span>
                      </button>
                    )}
                  </div>

                  {link.subLinks && (
                    <ul
                      className={`${
                        openDrop ? "max-h-[300px]" : "max-h-0"
                      } px-4 overflow-hidden transition-all duration-150`}
                    >
                      {link.subLinks.map((subLink) => (
                        <li key={subLink.url}>
                          <Link
                            href={subLink.url}
                            className="block w-full transition-colors py-2 px-4 hover:text-primary hover:bg-accent rounded-md"
                            onClick={() => setIsOpen(false)}
                          >
                            {subLink.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
