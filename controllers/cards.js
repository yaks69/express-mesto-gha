/* eslint-disable no-unused-vars */
const validationError = require('mongoose').Error.ValidationError;
const castError = require('mongoose').Error.CastError;
const Card = require('../models/card');
const InternalServerError = require('../errors/InternalServerError');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ForbiddenError = require('../errors/ForbiddenError');

const getCards = (req, res) => {
  Card.find({})
    .then((cards) => {
      res.send(cards);
    })
    .catch((err) => res.status(InternalServerError).send({ message: 'Произошла ошибка' }));
};

const postCard = (req, res, next) => {
  const { name, link } = req.body;
  const owner = req.user._id;
  Card.create({ name, link, owner })
    .then((card) => res.status(201).send({ data: card }))
    // eslint-disable-next-line no-unused-vars
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные при создании карточки'));
      } else {
        next(err);
      }
    });
};

const deleteCard = (req, res, next) => {
  const { cardId } = req.params;
  Card.findById(cardId)
    // eslint-disable-next-line consistent-return
    .then((card) => {
      if (card === null) {
        return next(new NotFoundError('Карточка с указанным id не найдена'));
      }
      if (!(card.owner.toString() === req.user._id)) {
        return next(new ForbiddenError('Нет прав для удаления данной карточки'));
      }
      Card.findByIdAndRemove(cardId)
        // eslint-disable-next-line consistent-return
        .then((data) => {
          if (data) {
            return res.send({ message: 'Карточка удалена' });
          }
        })
        .catch((err) => {
          if (err.name === 'CastError') {
            next(new BadRequestError('Переданы некорректные данные при удалении карточки'));
          } else next(err);
        });
    });
};

const addLike = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .then((card) => {
      if (card) {
        res.send({ data: card });
      } else {
        next(new NotFoundError('Передан несуществующий id карточки'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Передан некорректный id карточки'));
      } else {
        next(err);
      }
    });
};

const removeLike = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .then((card) => {
      if (card) {
        res.send({ data: card });
      } else {
        next(new NotFoundError('Передан несуществующий id карточки'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Передан некорректный id карточки'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  getCards,
  postCard,
  deleteCard,
  addLike,
  removeLike,
};
