SELECT
  *
FROM
  `sercan-v1.car_retails.orders`
WHERE
  order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)